import type pino from 'pino';
import type { DatabaseType } from '../types/common.types.js';
import type { TableInfo, ColumnInfo, SchemaInfo, QueryResult } from '../types/database.types.js';
import { DatabaseError } from '../core/errors.js';
import { createLogger } from '../core/logger.js';

export interface DatabaseAdapter {
  readonly type: DatabaseType;
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listTables(): Promise<TableInfo[]>;
  describeTable(tableName: string): Promise<ColumnInfo[]>;
  inspectSchema(): Promise<SchemaInfo>;
  executeSafeQuery(sql: string): Promise<QueryResult>;
  isConnected(): boolean;
}

/**
 * Shared lifecycle logic for all database adapters.
 * Subclasses implement the actual DB-specific calls.
 */
export abstract class BaseAdapter implements DatabaseAdapter {
  abstract readonly type: DatabaseType;
  readonly name: string;
  protected connected = false;
  protected readonly log: pino.Logger;

  constructor(name: string) {
    this.name = name;
    this.log = createLogger('database');
  }

  protected ensureConnected(): void {
    if (!this.connected) {
      throw new DatabaseError(`${this.name} (${this.type}): not connected`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract listTables(): Promise<TableInfo[]>;
  abstract describeTable(tableName: string): Promise<ColumnInfo[]>;
  abstract inspectSchema(): Promise<SchemaInfo>;
  abstract executeSafeQuery(sql: string): Promise<QueryResult>;
}
