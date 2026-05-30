import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { DatabaseManager } from '../../database/database.manager.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({});
type Input = z.infer<typeof InputSchema>;

interface ListDatabasesResult {
  databases: Array<{ name: string; type: string; connected: boolean }>;
}

export class ListDatabasesTool extends BaseTool<Input, ListDatabasesResult> {
  readonly name = 'list_databases';
  readonly description = 'Lists all configured database connections and their status';
  readonly inputSchema = InputSchema;

  constructor(private readonly dbManager: DatabaseManager) {
    super();
  }

  protected async execute(_input: Input, _ctx: RequestContext): Promise<ListDatabasesResult> {
    return { databases: this.dbManager.listAll() };
  }
}
