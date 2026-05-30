import type { DatabaseType } from './common.types.js';

export interface DatabaseConfig {
  name: string;
  type: DatabaseType;
  filePath?: string;
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface ServiceOverride {
  name: string;
  path: string;
  type?: string;
  framework?: string;
}

export interface WorkspaceConfig {
  workspaceRoot: string;
  ignoredFolders: string[];
  databases: DatabaseConfig[];
  services: ServiceOverride[];
  maxFileSize: number;
  maxSearchResults: number;
  maxQueryRows: number;
  cacheTimeoutMs: number;
}
