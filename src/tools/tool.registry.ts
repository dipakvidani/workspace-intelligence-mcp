import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BaseTool } from '../base/base.tool.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('tool');

/**
 * Registers a BaseTool instance with the MCP server.
 * Bridges our BaseTool abstraction to the MCP SDK's tool() API.
 */
export function registerTool(server: McpServer, tool: BaseTool<unknown, unknown>, workspaceRoot: string): void {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema.shape,
    async (args) => {
      const result = await tool.run(args, workspaceRoot);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    },
  );

  log.info({ tool: tool.name }, 'Registered MCP tool');
}
