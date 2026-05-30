import mysql from 'mysql2/promise';
import { BaseAdapter } from '../../base/base.adapter.js';
import type { TableInfo, ColumnInfo, SchemaInfo, QueryResult } from '../../types/database.types.js';
import { DatabaseError } from '../../core/errors.js';
import { addRowLimit } from '../../shared/utils/sql.utils.js';
import { DEFAULT_MAX_QUERY_ROWS, DEFAULT_MYSQL_PORT } from '../../shared/constants/database.constants.js';
import type { DatabaseConfig } from '../../types/config.types.js';

export class MySQLAdapter extends BaseAdapter {
  readonly type = 'mysql' as const;
  private pool: mysql.Pool | null = null;
  private databaseName: string;

  constructor(name: string, private readonly config: DatabaseConfig) {
    super(name);
    this.databaseName = config.database ?? '';
  }

  async connect(): Promise<void> {
    try {
      this.pool = mysql.createPool({
        uri: this.config.connectionString,
        host: this.config.host,
        port: this.config.port ?? DEFAULT_MYSQL_PORT,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        connectionLimit: 5,
        waitForConnections: true,
      });

      const conn = await this.pool.getConnection();
      conn.release();
      this.connected = true;
      this.log.info({ name: this.name }, 'MySQL connected');
    } catch (error) {
      throw new DatabaseError(`MySQL connection failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.pool?.end();
    this.pool = null;
    this.connected = false;
  }

  async listTables(): Promise<TableInfo[]> {
    this.ensureConnected();
    const [rows] = await this.pool!.query(`
      SELECT TABLE_NAME AS name, TABLE_TYPE AS table_type
      FROM information_schema.tables
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [this.databaseName]);

    return (rows as Array<{ name: string; table_type: string }>).map(r => ({
      name: r.name,
      type: (r.table_type === 'VIEW' ? 'view' : 'table') as 'table' | 'view',
    }));
  }

  async describeTable(tableName: string): Promise<ColumnInfo[]> {
    this.ensureConnected();
    const [rows] = await this.pool!.query(`
      SELECT
        COLUMN_NAME AS name,
        COLUMN_TYPE AS type,
        IS_NULLABLE = 'YES' AS nullable,
        COLUMN_DEFAULT AS default_value,
        COLUMN_KEY = 'PRI' AS primary_key
      FROM information_schema.columns
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [this.databaseName, tableName]);

    const cols = rows as Array<{ name: string; type: string; nullable: number; primary_key: number; default_value: string | null }>;
    if (cols.length === 0) {
      throw new DatabaseError(`Table "${tableName}" not found`);
    }

    return cols.map(c => ({
      name: c.name,
      type: c.type,
      nullable: Boolean(c.nullable),
      primaryKey: Boolean(c.primary_key),
      defaultValue: c.default_value,
    }));
  }

  async inspectSchema(): Promise<SchemaInfo> {
    this.ensureConnected();

    const [tableRows] = await this.pool!.query(`
      SELECT TABLE_NAME AS name, TABLE_TYPE AS table_type
      FROM information_schema.tables
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [this.databaseName]);

    const allObjects = tableRows as Array<{ name: string; table_type: string }>;
    const tables = allObjects.filter(r => r.table_type === 'BASE TABLE').map(r => ({ name: r.name, type: 'table' as const }));
    const views = allObjects.filter(r => r.table_type === 'VIEW').map(r => ({ name: r.name, type: 'view' as const }));

    const [indexRows] = await this.pool!.query(`
      SELECT INDEX_NAME AS name, TABLE_NAME AS table_name, COLUMN_NAME AS column_name, NON_UNIQUE AS non_unique
      FROM information_schema.statistics
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `, [this.databaseName]);

    const indexMap = new Map<string, { name: string; tableName: string; columns: string[]; unique: boolean }>();
    for (const row of indexRows as Array<{ name: string; table_name: string; column_name: string; non_unique: number }>) {
      const key = `${row.table_name}.${row.name}`;
      const existing = indexMap.get(key);
      if (existing) {
        existing.columns.push(row.column_name);
      } else {
        indexMap.set(key, {
          name: row.name,
          tableName: row.table_name,
          columns: [row.column_name],
          unique: row.non_unique === 0,
        });
      }
    }

    return { tables, views, indexes: [...indexMap.values()] };
  }

  async executeSafeQuery(sql: string): Promise<QueryResult> {
    this.ensureConnected();
    const limited = addRowLimit(sql, DEFAULT_MAX_QUERY_ROWS);

    try {
      const [rows, fields] = await this.pool!.query({ sql: limited, timeout: 5000 });
      const resultRows = rows as Record<string, unknown>[];
      const columns = Array.isArray(fields) ? fields.map(f => f.name) : [];

      return {
        columns,
        rows: resultRows,
        rowCount: resultRows.length,
        truncated: resultRows.length >= DEFAULT_MAX_QUERY_ROWS,
      };
    } catch (error) {
      this.log.error({ error, query: sql.slice(0, 200) }, 'Database query failed');
      throw new DatabaseError(`Database query failed safely (timeout or syntax)`);
    }
  }
}
