import { describe, it, expect } from 'vitest';
import { addRowLimit } from '../../src/shared/utils/sql.utils.js';

describe('sql.utils - addRowLimit', () => {
  it('appends LIMIT to a basic SELECT query', () => {
    const sql = 'SELECT * FROM users';
    expect(addRowLimit(sql, 100)).toBe('SELECT * FROM users LIMIT 100');
  });

  it('replaces LIMIT if it exceeds maxRows', () => {
    const sql = 'SELECT * FROM users LIMIT 500';
    expect(addRowLimit(sql, 100)).toBe('SELECT * FROM users LIMIT 100');
  });

  it('preserves LIMIT if it is within maxRows', () => {
    const sql = 'SELECT * FROM users LIMIT 50';
    expect(addRowLimit(sql, 100)).toBe('SELECT * FROM users LIMIT 50');
  });

  it('ignores non-SELECT queries', () => {
    const sql = 'EXPLAIN SELECT * FROM users';
    expect(addRowLimit(sql, 100)).toBe('EXPLAIN SELECT * FROM users');
  });

  it('handles WITH CTE clauses properly', () => {
    const sql = 'WITH cte AS (SELECT 1) SELECT * FROM cte LIMIT 999';
    expect(addRowLimit(sql, 100)).toBe('WITH cte AS (SELECT 1) SELECT * FROM cte LIMIT 100');
  });

  it('handles case-insensitivity in LIMIT replacement', () => {
    const sql = 'select * from users LiMiT 999';
    expect(addRowLimit(sql, 100)).toBe('select * from users LIMIT 100');
  });
});
