import {
  DEFAULT_IGNORED_DIRS,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_SEARCH_RESULTS,
  DEFAULT_MAX_QUERY_ROWS,
  DEFAULT_CACHE_TTL_MS,
} from '../shared/index.js';
import type { WorkspaceConfig } from '../types/config.types.js';

export function getDefaultConfig(workspaceRoot: string): WorkspaceConfig {
  return {
    workspaceRoot,
    ignoredFolders: DEFAULT_IGNORED_DIRS,
    databases: [],
    services: [],
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    maxSearchResults: DEFAULT_MAX_SEARCH_RESULTS,
    maxQueryRows: DEFAULT_MAX_QUERY_ROWS,
    cacheTimeoutMs: DEFAULT_CACHE_TTL_MS,
  };
}
