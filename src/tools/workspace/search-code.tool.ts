import { z } from 'zod';
import { BaseTool } from '../../base/base.tool.js';
import { CodeSearcher } from '../../workspace/code.searcher.js';
import type { SearchResult } from '../../types/workspace.types.js';
import type { RequestContext } from '../../context/request.context.js';

const InputSchema = z.object({
  query: z.string().min(1).describe('Search query string'),
  extensions: z.array(z.string()).optional().describe('Filter by file extensions'),
  paths: z.array(z.string()).optional().describe('Filter by path patterns'),
  ignorePatterns: z.array(z.string()).optional().describe('Additional ignore patterns'),
  maxResults: z.number().int().min(1).max(1000).default(200).describe('Maximum results'),
  caseSensitive: z.boolean().default(false).describe('Case-sensitive search'),
});
type Input = z.infer<typeof InputSchema>;

export class SearchCodeTool extends BaseTool<Input, SearchResult> {
  readonly name = 'search_code';
  readonly description = 'Searches codebase using ripgrep with support for extension/path filtering and ignore patterns';
  readonly inputSchema = InputSchema;

  protected async execute(input: Input, ctx: RequestContext): Promise<SearchResult> {
    const searcher = new CodeSearcher(ctx.workspaceRoot);
    return searcher.search(input);
  }
}
