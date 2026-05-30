import type { DatabaseAdapter } from '../base/base.adapter.js';
import { DatabaseError } from '../core/errors.js';
import { createLogger } from '../core/logger.js';
import type { DatabaseConfig } from '../types/config.types.js';
import { SQLiteAdapter } from './adapters/sqlite.adapter.js';
import { PostgresAdapter } from './adapters/postgres.adapter.js';
import { MySQLAdapter } from './adapters/mysql.adapter.js';

const log = createLogger('database');

/**
 * Central registry for database connections.
 * Manages lifecycle (lazy connect, disconnect all) for all adapters.
 */
export class DatabaseManager {
  private readonly adapters = new Map<string, DatabaseAdapter>();

  registerFromConfigs(configs: DatabaseConfig[]): void {
    for (const config of configs) {
      const adapter = this.createAdapter(config);
      this.adapters.set(config.name, adapter);
      log.info({ name: config.name, type: config.type }, 'Registered database adapter');
    }
  }

  getAdapter(name: string): DatabaseAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new DatabaseError(`Database "${name}" not found. Available: ${this.listNames().join(', ')}`);
    }
    return adapter;
  }

  async ensureConnected(name: string): Promise<DatabaseAdapter> {
    const adapter = this.getAdapter(name);
    if (!adapter.isConnected()) {
      await adapter.connect();
    }
    return adapter;
  }

  listNames(): string[] {
    return [...this.adapters.keys()];
  }

  listAll(): Array<{ name: string; type: string; connected: boolean }> {
    return [...this.adapters.entries()].map(([name, adapter]) => ({
      name,
      type: adapter.type,
      connected: adapter.isConnected(),
    }));
  }

  async disconnectAll(): Promise<void> {
    for (const [name, adapter] of this.adapters) {
      if (adapter.isConnected()) {
        try {
          await adapter.disconnect();
          log.info({ name }, 'Disconnected database');
        } catch (error) {
          log.error({ name, error }, 'Error disconnecting database');
        }
      }
    }
  }

  private createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'sqlite':
        if (!config.filePath) throw new DatabaseError(`SQLite "${config.name}" requires filePath`);
        return new SQLiteAdapter(config.name, config.filePath);
      case 'postgres':
        return new PostgresAdapter(config.name, config);
      case 'mysql':
        return new MySQLAdapter(config.name, config);
      default:
        throw new DatabaseError(`Unsupported database type: ${config.type}`);
    }
  }
}
