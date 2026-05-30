import { CacheManager } from './cache.manager.js';
import type { SchemaInfo, ColumnInfo } from '../types/database.types.js';

export class SchemaCache {
  private readonly schemaCache: CacheManager<SchemaInfo>;
  private readonly tableCache: CacheManager<ColumnInfo[]>;

  constructor(ttlMs: number) {
    this.schemaCache = new CacheManager(ttlMs);
    this.tableCache = new CacheManager(ttlMs);
  }

  getSchema(dbName: string): SchemaInfo | undefined {
    return this.schemaCache.get(dbName);
  }

  setSchema(dbName: string, schema: SchemaInfo): void {
    this.schemaCache.set(dbName, schema);
  }

  getTable(dbName: string, tableName: string): ColumnInfo[] | undefined {
    return this.tableCache.get(`${dbName}:${tableName}`);
  }

  setTable(dbName: string, tableName: string, columns: ColumnInfo[]): void {
    this.tableCache.set(`${dbName}:${tableName}`, columns);
  }

  invalidate(dbName?: string): void {
    if (dbName) {
      this.schemaCache.invalidate(dbName);
    } else {
      this.schemaCache.invalidate();
      this.tableCache.invalidate();
    }
  }
}
