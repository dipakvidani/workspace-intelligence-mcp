import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLogger } from './core/logger.js';
import { loadConfig } from './config/config.loader.js';
import { DatabaseManager } from './database/database.manager.js';
import { WorkspaceCache } from './cache/workspace.cache.js';
import { SchemaCache } from './cache/schema.cache.js';
import { registerAllTools } from './tools/index.js';
import type { WorkspaceConfig } from './types/config.types.js';

const log = createLogger('server');

export async function createServer(workspaceRoot?: string): Promise<{
  server: McpServer;
  config: WorkspaceConfig;
  dbManager: DatabaseManager;
}> {
  const config = await loadConfig(workspaceRoot);
  log.info({ root: config.workspaceRoot }, 'Workspace config loaded');

  const server = new McpServer({
    name: 'dev-workspace-assistant',
    version: '1.0.0',
  });

  const dbManager = new DatabaseManager();
  if (config.databases.length > 0) {
    dbManager.registerFromConfigs(config.databases);
  }

  const workspaceCache = new WorkspaceCache(config.cacheTimeoutMs);
  const schemaCache = new SchemaCache(config.cacheTimeoutMs);

  registerAllTools(server, config, dbManager, workspaceCache, schemaCache);

  log.info('MCP server created with all tools registered');

  return { server, config, dbManager };
}
