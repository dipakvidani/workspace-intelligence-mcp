import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTool } from './tool.registry.js';
import { WorkspaceCache } from '../cache/workspace.cache.js';
import { SchemaCache } from '../cache/schema.cache.js';
import { DatabaseManager } from '../database/database.manager.js';
import type { WorkspaceConfig } from '../types/config.types.js';

import { GetWorkspaceStructureTool } from './workspace/get-workspace-structure.tool.js';
import { DetectServicesTool } from './workspace/detect-services.tool.js';
import { ListFilesTool } from './workspace/list-files.tool.js';
import { SearchCodeTool } from './workspace/search-code.tool.js';
import { ReadFileTool } from './workspace/read-file.tool.js';
import { GetProjectSummaryTool } from './workspace/get-project-summary.tool.js';

import { ListDatabasesTool } from './database/list-databases.tool.js';
import { ListTablesTool } from './database/list-tables.tool.js';
import { DescribeTableTool } from './database/describe-table.tool.js';
import { InspectSchemaTool } from './database/inspect-schema.tool.js';
import { RunSafeQueryTool } from './database/run-safe-query.tool.js';

import { GetWorkspaceConfigTool } from './utility/get-workspace-config.tool.js';
import { HealthCheckTool } from './utility/health-check.tool.js';

export function registerAllTools(
  server: McpServer,
  config: WorkspaceConfig,
  dbManager: DatabaseManager,
  workspaceCache: WorkspaceCache,
  schemaCache: SchemaCache,
): void {
  const root = config.workspaceRoot;

  const tools = [
    new GetWorkspaceStructureTool(workspaceCache),
    new DetectServicesTool(workspaceCache),
    new ListFilesTool(),
    new SearchCodeTool(),
    new ReadFileTool(config.maxFileSize),
    new GetProjectSummaryTool(workspaceCache, dbManager),

    new ListDatabasesTool(dbManager),
    new ListTablesTool(dbManager),
    new DescribeTableTool(dbManager, schemaCache),
    new InspectSchemaTool(dbManager, schemaCache),
    new RunSafeQueryTool(dbManager),

    new GetWorkspaceConfigTool(),
    new HealthCheckTool(dbManager),
  ];

  for (const tool of tools) {
    registerTool(server, tool, root);
  }
}
