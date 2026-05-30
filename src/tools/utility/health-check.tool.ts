import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { DatabaseManager } from '../../database/database.manager.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({});
type Input = z.infer<typeof InputSchema>;

interface HealthCheckResult {
  status: 'healthy';
  uptime: number;
  workspaceRoot: string;
  databases: Array<{ name: string; type: string; connected: boolean }>;
  timestamp: string;
}

const startTime = Date.now();

export class HealthCheckTool extends BaseTool<Input, HealthCheckResult> {
  readonly name = 'health_check';
  readonly description = 'Returns server health status, uptime, and database connection states';
  readonly inputSchema = InputSchema;

  constructor(private readonly dbManager: DatabaseManager) {
    super();
  }

  protected async execute(_input: Input, ctx: RequestContext): Promise<HealthCheckResult> {
    return {
      status: 'healthy',
      uptime: Math.round((Date.now() - startTime) / 1000),
      workspaceRoot: ctx.workspaceRoot,
      databases: this.dbManager.listAll(),
      timestamp: new Date().toISOString(),
    };
  }
}
