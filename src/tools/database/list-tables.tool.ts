import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { DatabaseManager } from '../../database/database.manager.js';
import type { TableInfo } from '../../types/database.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({
  database: z.string().min(1).describe('Database name as defined in config'),
});
type Input = z.infer<typeof InputSchema>;

export class ListTablesTool extends BaseTool<Input, TableInfo[]> {
  readonly name = 'list_tables';
  readonly description = 'Lists all tables and views in the specified database';
  readonly inputSchema = InputSchema;

  constructor(private readonly dbManager: DatabaseManager) {
    super();
  }

  protected async execute(input: Input, _ctx: RequestContext): Promise<TableInfo[]> {
    const adapter = await this.dbManager.ensureConnected(input.database);
    return adapter.listTables();
  }
}
