import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { DatabaseManager } from '../../database/database.manager.js';
import { SchemaCache } from '../../cache/schema.cache.js';
import type { ColumnInfo } from '../../types/database.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({
  database: z.string().min(1).describe('Database name as defined in config'),
  table: z.string().min(1).describe('Table name to describe'),
});
type Input = z.infer<typeof InputSchema>;

export class DescribeTableTool extends BaseTool<Input, ColumnInfo[]> {
  readonly name = 'describe_table';
  readonly description = 'Returns column definitions for a specific table including types, nullability, and primary keys';
  readonly inputSchema = InputSchema;

  constructor(
    private readonly dbManager: DatabaseManager,
    private readonly schemaCache: SchemaCache,
  ) {
    super();
  }

  protected async execute(input: Input, _ctx: RequestContext): Promise<ColumnInfo[]> {
    const cached = this.schemaCache.getTable(input.database, input.table);
    if (cached) return cached;

    const adapter = await this.dbManager.ensureConnected(input.database);
    const columns = await adapter.describeTable(input.table);

    this.schemaCache.setTable(input.database, input.table, columns);
    return columns;
  }
}
