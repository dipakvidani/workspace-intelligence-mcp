import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { DatabaseManager } from '../../database/database.manager.js';
import { QueryGuard } from '../../safety/query.guard.js';
import type { QueryResult } from '../../types/database.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({
  database: z.string().min(1).describe('Database name as defined in config'),
  query: z.string().min(1).describe('SQL query (read-only: SELECT, EXPLAIN, PRAGMA, DESCRIBE, SHOW)'),
});
type Input = z.infer<typeof InputSchema>;

export class RunSafeQueryTool extends BaseTool<Input, QueryResult> {
  readonly name = 'run_safe_query';
  readonly description = 'Executes a read-only SQL query against a configured database. Blocks all write operations.';
  readonly inputSchema = InputSchema;

  private readonly queryGuard = new QueryGuard();

  constructor(private readonly dbManager: DatabaseManager) {
    super();
  }

  protected async execute(input: Input, _ctx: RequestContext): Promise<QueryResult> {
    this.queryGuard.validate(input.query);
    const adapter = await this.dbManager.ensureConnected(input.database);
    return adapter.executeSafeQuery(input.query);
  }
}
