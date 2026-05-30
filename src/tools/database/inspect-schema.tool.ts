import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { DatabaseManager } from '../../database/database.manager.js';
import { SchemaCache } from '../../cache/schema.cache.js';
import type { SchemaInfo } from '../../types/database.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({
  database: z.string().min(1).describe('Database name as defined in config'),
});
type Input = z.infer<typeof InputSchema>;

export class InspectSchemaTool extends BaseTool<Input, SchemaInfo> {
  readonly name = 'inspect_schema';
  readonly description = 'Returns full schema overview including tables, views, and indexes for a database';
  readonly inputSchema = InputSchema;

  constructor(
    private readonly dbManager: DatabaseManager,
    private readonly schemaCache: SchemaCache,
  ) {
    super();
  }

  protected async execute(input: Input, _ctx: RequestContext): Promise<SchemaInfo> {
    const cached = this.schemaCache.getSchema(input.database);
    if (cached) return cached;

    const adapter = await this.dbManager.ensureConnected(input.database);
    const schema = await adapter.inspectSchema();

    this.schemaCache.setSchema(input.database, schema);
    return schema;
  }
}
