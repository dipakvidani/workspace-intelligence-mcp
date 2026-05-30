import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { WorkspaceScanner } from '../../workspace/workspace.scanner.js';
import { WorkspaceCache } from '../../cache/workspace.cache.js';
import type { WorkspaceStructure } from '../../types/workspace.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({
  depth: z.number().int().min(1).max(10).default(5).describe('Maximum directory depth'),
});
type Input = z.infer<typeof InputSchema>;

export class GetWorkspaceStructureTool extends BaseTool<Input, WorkspaceStructure> {
  readonly name = 'get_workspace_structure';
  readonly description = 'Returns the directory tree of the workspace up to the specified depth';
  readonly inputSchema = InputSchema;

  constructor(private readonly cache: WorkspaceCache) {
    super();
  }

  protected async execute(input: Input, ctx: RequestContext): Promise<WorkspaceStructure> {
    const scanner = new WorkspaceScanner(ctx.workspaceRoot, this.cache, undefined, input.depth);
    return scanner.getStructure();
  }
}
