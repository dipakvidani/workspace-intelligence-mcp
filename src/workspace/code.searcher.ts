import { execFile } from 'child_process';
import { promisify } from 'util';
import { BaseService } from '../base/base.service.js';
import type { SearchMatch, SearchResult } from '../types/workspace.types.js';
import { DEFAULT_MAX_SEARCH_RESULTS, DEFAULT_IGNORED_DIRS } from '../shared/constants/workspace.constants.js';
import { normalizeSlashes } from '../shared/utils/path.utils.js';

const execFileAsync = promisify(execFile);

interface SearchOptions {
  query: string;
  extensions?: string[];
  paths?: string[];
  ignorePatterns?: string[];
  maxResults?: number;
  caseSensitive?: boolean;
}

export class CodeSearcher extends BaseService {
  constructor(
    private readonly workspaceRoot: string,
  ) {
    super('workspace');
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const start = performance.now();
    const maxResults = options.maxResults ?? DEFAULT_MAX_SEARCH_RESULTS;

    const args = this.buildRipgrepArgs(options, maxResults);

    this.log.debug({ query: options.query, args }, 'Running ripgrep search');

    try {
      const { stdout } = await execFileAsync('rg', args, {
        cwd: this.workspaceRoot,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000,
      });

      const matches = this.parseOutput(stdout);
      const truncated = matches.length >= maxResults;

      return {
        query: options.query,
        matches: matches.slice(0, maxResults),
        totalMatches: matches.length,
        truncated,
        searchDurationMs: performance.now() - start,
      };
    } catch (error) {
      /* ripgrep exits with code 1 when no matches found — not an error */
      if (this.isNoMatchExit(error)) {
        return {
          query: options.query,
          matches: [],
          totalMatches: 0,
          truncated: false,
          searchDurationMs: performance.now() - start,
        };
      }
      throw error;
    }
  }

  private buildRipgrepArgs(options: SearchOptions, maxResults: number): string[] {
    const args = [
      '--json',
      '--max-count', String(maxResults),
      '--no-heading',
    ];

    if (!options.caseSensitive) {
      args.push('--ignore-case');
    }

    for (const dir of DEFAULT_IGNORED_DIRS) {
      args.push('--glob', `!**/${dir}/**`);
    }

    if (options.ignorePatterns) {
      for (const pattern of options.ignorePatterns) {
        args.push('--glob', `!${pattern}`);
      }
    }

    if (options.extensions) {
      for (const ext of options.extensions) {
        const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
        args.push('--type-add', `custom:*.${cleanExt}`, '--type', 'custom');
      }
    }

    if (options.paths) {
      for (const p of options.paths) {
        args.push('--glob', normalizeSlashes(p));
      }
    }

    args.push('--', options.query);

    return args;
  }

  private parseOutput(stdout: string): SearchMatch[] {
    const matches: SearchMatch[] = [];

    for (const line of stdout.split('\n')) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as {
          type: string;
          data?: {
            path?: { text?: string };
            line_number?: number;
            submatches?: Array<{ start: number; match: { text: string } }>;
            lines?: { text?: string };
          };
        };

        if (parsed.type === 'match' && parsed.data) {
          const d = parsed.data;
          matches.push({
            file: normalizeSlashes(d.path?.text ?? ''),
            line: d.line_number ?? 0,
            column: d.submatches?.[0]?.start ?? 0,
            match: d.submatches?.[0]?.match?.text ?? '',
            context: d.lines?.text?.trimEnd(),
          });
        }
      } catch {
        /* Skip malformed JSON lines */
      }
    }

    return matches;
  }

  private isNoMatchExit(error: unknown): boolean {
    return error instanceof Error && 'code' in error && (error as { code: unknown }).code === 1;
  }
}
