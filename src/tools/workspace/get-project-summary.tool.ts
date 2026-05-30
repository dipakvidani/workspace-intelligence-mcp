import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { ServiceDetector } from '../../workspace/service.detector.js';
import { WorkspaceScanner } from '../../workspace/workspace.scanner.js';
import { WorkspaceCache } from '../../cache/workspace.cache.js';
import { DatabaseManager } from '../../database/database.manager.js';
import type { ProjectSummary } from '../../types/workspace.types.js';
import type { RequestContext } from '../../context/request.context.js';
import path from 'path';

const InputSchema = z.object({});
type Input = z.infer<typeof InputSchema>;

export class GetProjectSummaryTool extends BaseTool<Input, ProjectSummary> {
  readonly name = 'get_project_summary';
  readonly description = 'Returns a high-level summary of the workspace including services, languages, frameworks, and database presence';
  readonly inputSchema = InputSchema;

  constructor(
    private readonly cache: WorkspaceCache,
    private readonly dbManager: DatabaseManager,
  ) {
    super();
  }

  protected async execute(_input: Input, ctx: RequestContext): Promise<ProjectSummary> {
    const detector = new ServiceDetector(ctx.workspaceRoot, this.cache);
    const scanner = new WorkspaceScanner(ctx.workspaceRoot, this.cache);

    const [services, structure] = await Promise.all([
      detector.detect(),
      scanner.getStructure(),
    ]);

    const languages = [...new Set(services.flatMap(s => s.language ? [s.language] : []))];
    const frameworks = [...new Set(services.flatMap(s => s.framework ? [s.framework] : []))];
    const hasDocker = services.some(s => s.hasDocker);
    const hasDatabases = this.dbManager.listNames().length > 0;

    return {
      name: path.basename(ctx.workspaceRoot),
      root: ctx.workspaceRoot,
      services,
      totalFiles: structure.totalFiles,
      languages,
      frameworks,
      hasMonorepo: services.length > 1,
      hasDatabases,
      hasDocker,
    };
  }
}
