import { describe, it, expect, beforeEach } from 'vitest';
import { QueryGuard } from '../../src/safety/query.guard.js';

describe('QueryGuard', () => {
  let guard: QueryGuard;

  beforeEach(() => {
    guard = new QueryGuard();
  });

  describe('validate', () => {
    it('allows basic SELECT queries', () => {
      expect(() => guard.validate('SELECT * FROM users')).not.toThrow();
      expect(() => guard.validate('  select id, name from users  ')).not.toThrow();
    });

    it('allows EXPLAIN queries', () => {
      expect(() => guard.validate('EXPLAIN SELECT * FROM users')).not.toThrow();
      expect(() => guard.validate('EXPLAIN QUERY PLAN SELECT * FROM users')).not.toThrow();
    });

    it('allows WITH (CTE) queries', () => {
      expect(() => guard.validate('WITH cte AS (SELECT 1) SELECT * FROM cte')).not.toThrow();
    });
    
    it('allows PRAGMA queries', () => {
      expect(() => guard.validate('PRAGMA table_info("users")')).not.toThrow();
    });

    it('blocks INSERT queries', () => {
      expect(() => guard.validate("INSERT INTO users (name) VALUES ('test')")).toThrow(/Query blocked/);
    });

    it('blocks UPDATE queries', () => {
      expect(() => guard.validate("UPDATE users SET name='test'")).toThrow(/Query blocked/);
    });

    it('blocks DELETE queries', () => {
      expect(() => guard.validate('DELETE FROM users')).toThrow(/Query blocked/);
    });

    it('blocks DROP queries', () => {
      expect(() => guard.validate('DROP TABLE users')).toThrow(/Query blocked/);
    });

    it('blocks multiple statements (trailing semicolon)', () => {
      expect(() => guard.validate('SELECT * FROM users;')).toThrow(/Query blocked/);
      expect(() => guard.validate('SELECT 1; DROP TABLE users')).toThrow(/Query blocked/);
    });

    it('blocks SQL line comments', () => {
      expect(() => guard.validate('SELECT 1 -- bypass')).toThrow(/Query blocked/);
    });

    it('blocks SQL block comments', () => {
      expect(() => guard.validate('SELECT /* bypass */ 1')).toThrow(/Query blocked/);
    });
    
    it('blocks unhandled starting keywords', () => {
       expect(() => guard.validate('GRANT ALL ON users TO admin')).toThrow(/Query blocked/);
       expect(() => guard.validate('VACUUM')).toThrow(/Query blocked/);
    });

    it('blocks DoS vectors (sleep, benchmark)', () => {
      expect(() => guard.validate('SELECT pg_sleep(10)')).toThrow(/Query blocked/);
      expect(() => guard.validate('SELECT SLEEP(10)')).toThrow(/Query blocked/);
      expect(() => guard.validate('SELECT benchmark(1000000, MD5(1))')).toThrow(/Query blocked/);
    });

    it('blocks dangerous data exfiltration/write commands', () => {
      expect(() => guard.validate('COPY users TO STDOUT')).toThrow(/Query blocked/);
      expect(() => guard.validate("SELECT * INTO OUTFILE '/tmp/hack'")).toThrow(/Query blocked/);
    });
  });
});
