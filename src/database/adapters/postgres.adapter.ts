import pg from 'pg';
import { BaseAdapter } from '../../base/base.adapter.js';
import type { TableInfo, ColumnInfo, SchemaInfo, QueryResult } from '../../types/database.types.js';
import { DatabaseError } from '../../core/errors.js';
import { addRowLimit } from '../../shared/utils/sql.utils.js';
import { DEFAULT_MAX_QUERY_ROWS, DEFAULT_POSTGRES_PORT } from '../../shared/constants/database.constants.js';
import type { DatabaseConfig } from '../../types/config.types.js';

export class PostgresAdapter extends BaseAdapter {
  readonly type = 'postgres' as const;
  private pool: pg.Pool | null = null;

  constructor(name: string, private readonly config: DatabaseConfig) {
    super(name);
  }

  async connect(): Promise<void> {
    try {
      this.pool = new pg.Pool({
        connectionString: this.config.connectionString,
        host: this.config.host,
        port: this.config.port ?? DEFAULT_POSTGRES_PORT,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        max: 5,
        idleTimeoutMillis: 30_000,
        statement_timeout: 5000,
        query_timeout: 5000,
      });

      /* Verify connection */
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
      this.log.info({ name: this.name }, 'PostgreSQL connected');
    } catch (error) {
      throw new DatabaseError(`PostgreSQL connection failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.pool?.end();
    this.pool = null;
    this.connected = false;
  }

  async listTables(): Promise<TableInfo[]> {
    this.ensureConnected();
    const result = await this.pool!.query(`
      SELECT table_name AS name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    return result.rows.map((r: { name: string; table_type: string }) => ({
      name: r.name,
      type: (r.table_type === 'VIEW' ? 'view' : 'table') as 'table' | 'view',
    }));
  }

  async describeTable(tableName: string): Promise<ColumnInfo[]> {
    this.ensureConnected();
    const result = await this.pool!.query(`
      SELECT
        c.column_name AS name,
        c.data_type AS type,
        c.is_nullable = 'YES' AS nullable,
        c.column_default AS default_value,
        EXISTS (
          SELECT 1 
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
          WHERE kcu.table_schema = 'public' 
            AND kcu.table_name = c.table_name 
            AND kcu.column_name = c.column_name
            AND tc.constraint_type = 'PRIMARY KEY'
        ) AS primary_key
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = $1
      ORDER BY c.ordinal_position
    `, [tableName]);

    if (result.rows.length === 0) {
      throw new DatabaseError(`Table "${tableName}" not found`);
    }

    return result.rows.map((r: { name: string; type: string; nullable: boolean; primary_key: boolean; default_value: string | null }) => ({
      name: r.name,
      type: r.type,
      nullable: r.nullable,
      primaryKey: r.primary_key,
      defaultValue: r.default_value,
    }));
  }

  async inspectSchema(): Promise<SchemaInfo> {
    this.ensureConnected();

    const tablesResult = await this.pool!.query(`
      SELECT table_name AS name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows
      .filter((r: { table_type: string }) => r.table_type === 'BASE TABLE')
      .map((r: { name: string }) => ({ name: r.name, type: 'table' as const }));

    const views = tablesResult.rows
      .filter((r: { table_type: string }) => r.table_type === 'VIEW')
      .map((r: { name: string }) => ({ name: r.name, type: 'view' as const }));

    const indexResult = await this.pool!.query(`
      SELECT indexname AS name, tablename AS table_name, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexes = indexResult.rows.map((r: { name: string; table_name: string; indexdef: string }) => ({
      name: r.name,
      tableName: r.table_name,
      columns: this.extractColumnsFromIndexDef(r.indexdef),
      unique: r.indexdef.toUpperCase().includes('UNIQUE'),
    }));

    return { tables, views, indexes };
  }

  async executeSafeQuery(sql: string): Promise<QueryResult> {
    this.ensureConnected();
    const limited = addRowLimit(sql, DEFAULT_MAX_QUERY_ROWS);

    try {
      const result = await this.pool!.query(limited);
      const columns = result.fields.map(f => f.name);
      const rows = result.rows as Record<string, unknown>[];

      return {
        columns,
        rows,
        rowCount: rows.length,
        truncated: rows.length >= DEFAULT_MAX_QUERY_ROWS,
      };
    } catch (error) {
      this.log.error({ error, query: sql.slice(0, 200) }, 'Database query failed');
      throw new DatabaseError(`Database query failed safely (timeout or syntax)`);
    }
  }

  private extractColumnsFromIndexDef(indexDef: string): string[] {
    const match = indexDef.match(/\(([^)]+)\)/);
    return match ? match[1].split(',').map(c => c.trim()) : [];
  }
}
