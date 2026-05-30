export interface ResultMetadata {
  duration_ms: number;
  timestamp: string;
  requestId: string;
}

export interface ResultError {
  code: string;
  message: string;
}

export type Result<T> =
  | { success: true; data: T; metadata: ResultMetadata }
  | { success: false; error: ResultError; metadata: ResultMetadata };

export type DatabaseType = 'sqlite' | 'postgres' | 'mysql';

export type ServiceType = 'frontend' | 'backend' | 'shared' | 'service' | 'monorepo-root' | 'unknown';

export type LogDomain = 'server' | 'workspace' | 'database' | 'tool' | 'security' | 'config' | 'cache';
