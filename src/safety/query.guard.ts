import { QueryBlockedError } from '../core/errors.js';
import { createLogger } from '../core/logger.js';
import { ALLOWED_SQL_KEYWORDS, BLOCKED_SQL_KEYWORDS, BLOCKED_SQL_PATTERNS } from '../shared/constants/security.constants.js';
import { extractFirstKeyword } from '../shared/utils/sql.utils.js';

const log = createLogger('security');

/**
 * Validates SQL queries are read-only before execution.
 * Defense-in-depth: keyword allowlist + blocklist + pattern matching.
 */
export class QueryGuard {
  validate(sql: string): void {
    const trimmed = sql.trim();
    if (!trimmed) {
      throw new QueryBlockedError('Empty query');
    }

    this.checkBlockedPatterns(trimmed);
    this.checkKeyword(trimmed);
  }

  private checkKeyword(sql: string): void {
    const keyword = extractFirstKeyword(sql);

    if (BLOCKED_SQL_KEYWORDS.has(keyword)) {
      log.warn({ keyword, query: sql.slice(0, 100) }, 'Blocked SQL keyword detected');
      throw new QueryBlockedError(`Keyword "${keyword}" is not allowed`);
    }

    if (!ALLOWED_SQL_KEYWORDS.has(keyword)) {
      log.warn({ keyword, query: sql.slice(0, 100) }, 'Unrecognized SQL keyword');
      throw new QueryBlockedError(`Keyword "${keyword}" is not in the allowlist`);
    }

    /* WITH must be followed by a SELECT (CTE usage only) */
    if (keyword === 'WITH') {
      const afterWith = sql.toUpperCase();
      if (!afterWith.includes('SELECT')) {
        throw new QueryBlockedError('WITH clause must contain a SELECT statement');
      }
    }
  }

  private checkBlockedPatterns(sql: string): void {
    for (const pattern of BLOCKED_SQL_PATTERNS) {
      if (pattern.test(sql)) {
        log.warn({ pattern: pattern.source, query: sql.slice(0, 100) }, 'Blocked SQL pattern detected');
        throw new QueryBlockedError(`Query matches blocked pattern: ${pattern.source}`);
      }
    }
  }
}
