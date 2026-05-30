import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { ServiceDetector } from '../../workspace/service.detector.js';
import { WorkspaceCache } from '../../cache/workspace.cache.js';
import type { ServiceInfo } from '../../types/workspace.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({});
type Input = z.infer<typeof InputSchema>;

export class DetectServicesTool extends BaseTool<Input, ServiceInfo[]> {
  readonly name = 'detect_services';
  readonly description = 'Auto-detects services, packages, and applications within a monorepo workspace';
  readonly inputSchema = InputSchema;

  constructor(private readonly cache: WorkspaceCache) {
    super();
  }

  protected async execute(_input: Input, ctx: RequestContext): Promise<ServiceInfo[]> {
    const detector = new ServiceDetector(ctx.workspaceRoot, this.cache);
    return detector.detect();
  }
}
