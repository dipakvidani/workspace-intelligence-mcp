import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { FileReader } from '../../workspace/file.reader.js';
import { PathGuard } from '../../safety/path.guard.js';
import type { FileContent } from '../../types/workspace.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({
  path: z.string().min(1).describe('Relative file path within workspace'),
});
type Input = z.infer<typeof InputSchema>;

export class ReadFileTool extends BaseTool<Input, FileContent> {
  readonly name = 'read_file';
  readonly description = 'Reads a file from the workspace with path traversal protection and size limits';
  readonly inputSchema = InputSchema;

  constructor(private readonly maxFileSize: number) {
    super();
  }

  protected async execute(input: Input, ctx: RequestContext): Promise<FileContent> {
    const guard = new PathGuard(ctx.workspaceRoot);
    const reader = new FileReader(guard, this.maxFileSize);
    return reader.read(input.path);
  }
}
