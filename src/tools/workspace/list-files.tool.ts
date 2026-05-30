import { z } from 'zod';
import fg from 'fast-glob';
import { BaseTool } from '../../base/base.tool.js';
import type { RequestContext } from '../../context/request.context.js';
import { DEFAULT_IGNORED_GLOBS } from '../../shared/constants/workspace.constants.js';
import { normalizeSlashes } from '../../shared/utils/path.utils.js';

const InputSchema = z.object({
  pattern: z.string().default('**/*').describe('Glob pattern to match files'),
  extensions: z.array(z.string()).optional().describe('File extensions to filter (e.g., [".ts", ".js"])'),
  maxResults: z.number().int().min(1).max(5000).default(500).describe('Maximum files to return'),
});
type Input = z.infer<typeof InputSchema>;

interface ListFilesResult {
  files: string[];
  totalCount: number;
  truncated: boolean;
}

export class ListFilesTool extends BaseTool<Input, ListFilesResult> {
  readonly name = 'list_files';
  readonly description = 'Lists files in the workspace matching a glob pattern and optional extension filter';
  readonly inputSchema = InputSchema;

  protected async execute(input: Input, ctx: RequestContext): Promise<ListFilesResult> {
    let pattern = input.pattern;

    if (input.extensions && input.extensions.length > 0) {
      const exts = input.extensions.map(e => e.startsWith('.') ? e : `.${e}`).join(',');
      pattern = `**/*{${exts}}`;
    }

    const files = await fg(pattern, {
      cwd: ctx.workspaceRoot,
      ignore: DEFAULT_IGNORED_GLOBS,
      onlyFiles: true,
      dot: false,
    });

    const sorted = files.map(normalizeSlashes).sort();

    return {
      files: sorted.slice(0, input.maxResults),
      totalCount: sorted.length,
      truncated: sorted.length > input.maxResults,
    };
  }
}
