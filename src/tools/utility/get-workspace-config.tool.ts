import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { getConfig } from '../../config/config.loader.js';
import type { WorkspaceConfig } from '../../types/config.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({});
type Input = z.infer<typeof InputSchema>;

export class GetWorkspaceConfigTool extends BaseTool<Input, WorkspaceConfig> {
  readonly name = 'get_workspace_config';
  readonly description = 'Returns the current workspace configuration including database definitions, ignore patterns, and limits';
  readonly inputSchema = InputSchema;

  protected async execute(_input: Input, _ctx: RequestContext): Promise<WorkspaceConfig> {
    return getConfig();
  }
}
