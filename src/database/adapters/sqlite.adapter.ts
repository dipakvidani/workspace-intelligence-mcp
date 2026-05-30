import Database from 'better-sqlite3';
import { BaseAdapter } from '../../base/base.adapter.js';
import type { TableInfo, ColumnInfo, SchemaInfo, QueryResult } from '../../types/database.types.js';
import { DatabaseError } from '../../core/errors.js';
import { addRowLimit } from '../../shared/utils/sql.utils.js';
import { DEFAULT_MAX_QUERY_ROWS } from '../../shared/constants/database.constants.js';

export class SQLiteAdapter extends BaseAdapter {
  readonly type = 'sqlite' as const;
  private db: Database.Database | null = null;

  constructor(name: string, private readonly filePath: string) {
    super(name);
  }

  async connect(): Promise<void> {
    try {
      this.db = new Database(this.filePath, { readonly: true });
      this.connected = true;
      this.log.info({ name: this.name, path: this.filePath }, 'SQLite connected');
    } catch (error) {
      throw new DatabaseError(`SQLite connection failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.db?.close();
    this.db = null;
    this.connected = false;
  }

  async listTables(): Promise<TableInfo[]> {
    this.ensureConnected();
    const rows = this.db!.prepare(
      `SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all() as Array<{ name: string; type: string }>;

    return rows.map(r => ({
      name: r.name,
      type: r.type as 'table' | 'view',
    }));
  }

  async describeTable(tableName: string): Promise<ColumnInfo[]> {
    this.ensureConnected();
    const safeTableName = tableName.replace(/"/g, '""');
    const columns = this.db!.prepare(`PRAGMA table_info("${safeTableName}")`).all() as Array<{
      name: string; type: string; notnull: number; dflt_value: string | null; pk: number;
    }>;

    if (columns.length === 0) {
      throw new DatabaseError(`Table "${tableName}" not found`);
    }

    return columns.map(c => ({
      name: c.name,
      type: c.type,
      nullable: c.notnull === 0,
      primaryKey: c.pk > 0,
      defaultValue: c.dflt_value,
    }));
  }

  async inspectSchema(): Promise<SchemaInfo> {
    this.ensureConnected();
    const allObjects = this.db!.prepare(
      `SELECT name, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name`
    ).all() as Array<{ name: string; type: string }>;

    const tables = allObjects.filter(o => o.type === 'table').map(o => ({ name: o.name, type: 'table' as const }));
    const views = allObjects.filter(o => o.type === 'view').map(o => ({ name: o.name, type: 'view' as const }));

    const indexRows = this.db!.prepare(
      `SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'`
    ).all() as Array<{ name: string; tbl_name: string }>;

    const indexes = indexRows.map(idx => {
      const safeIdxName = idx.name.replace(/"/g, '""');
      const safeTblName = idx.tbl_name.replace(/"/g, '""');
      const info = this.db!.prepare(`PRAGMA index_info("${safeIdxName}")`).all() as Array<{ name: string }>;
      const unique = this.db!.prepare(`PRAGMA index_list("${safeTblName}")`).all() as Array<{ name: string; unique: number }>;
      const isUnique = unique.find(u => u.name === idx.name)?.unique === 1;
      return {
        name: idx.name,
        tableName: idx.tbl_name,
        columns: info.map(i => i.name),
        unique: isUnique ?? false,
      };
    });

    return { tables, views, indexes };
  }

  async executeSafeQuery(sql: string): Promise<QueryResult> {
    this.ensureConnected();
    const limited = addRowLimit(sql, DEFAULT_MAX_QUERY_ROWS);

    try {
      const stmt = this.db!.prepare(limited);
      const rows = stmt.all() as Record<string, unknown>[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        columns,
        rows,
        rowCount: rows.length,
        truncated: rows.length >= DEFAULT_MAX_QUERY_ROWS,
      };
    } catch (error) {
      this.log.error({ error, query: sql.slice(0, 200) }, 'Database query failed');
      throw new DatabaseError(`Database query failed safely (syntax or constraint)`);
    }
  }
}
