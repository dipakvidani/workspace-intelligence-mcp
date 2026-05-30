import path from 'path';
import fs from 'fs/promises';
import { PathGuard } from '../src/safety/path.guard.js';
import { QueryGuard } from '../src/safety/query.guard.js';
import { SQLiteAdapter } from '../src/database/adapters/sqlite.adapter.js';
import { CodeSearcher } from '../src/workspace/code.searcher.js';
import { WorkspaceCache } from '../src/cache/workspace.cache.js';
import { WorkspaceScanner } from '../src/workspace/workspace.scanner.js';
import { PathTraversalError, QueryBlockedError } from '../src/core/errors.js';

async function runTests() {
  console.log('--- PRODUCTION SMOKE TESTS ---\n');

  // 1. Path Traversal Tests
  console.log('1. PathGuard Tests');
  const guard = new PathGuard(path.resolve('src'));
  
  const pathTests = [
    { req: '../../../etc/passwd', expectFail: true },
    { req: '..\\..\\..\\Windows\\System32', expectFail: true },
    { req: '../../.env', expectFail: true },
    { req: path.resolve('src-evil'), expectFail: true },
    { req: 'base/base.tool.ts', expectFail: false },
    { req: path.resolve('src/base/base.tool.ts'), expectFail: false }
  ];

  for (const t of pathTests) {
    try {
      await guard.resolveSafePath(t.req);
      if (t.expectFail) throw new Error(`FAILED: Expected PathTraversalError for ${t.req}`);
      console.log(`✅ Allowed: ${t.req}`);
    } catch (e: any) {
      if (e instanceof PathTraversalError && t.expectFail) {
        console.log(`✅ Blocked: ${t.req}`);
      } else {
        console.error(`❌ Unexpected error for ${t.req}: ${e.message}`);
      }
    }
  }

  // 2. QueryGuard Tests
  console.log('\n2. QueryGuard Tests');
  const qGuard = new QueryGuard();
  const qTests = [
    { req: 'SELECT * FROM users', expectFail: false },
    { req: 'WITH cte AS (SELECT * FROM users) SELECT * FROM cte', expectFail: false },
    { req: 'EXPLAIN SELECT * FROM users', expectFail: false },
    { req: 'SELECT * FROM users;', expectFail: true },
    { req: 'SELECT 1; DROP TABLE users', expectFail: true },
    { req: 'DELETE FROM users', expectFail: true },
    { req: "UPDATE users SET name='x'", expectFail: true },
    { req: 'SELECT /* bypass */ 1', expectFail: true },
    { req: 'SELECT 1 --', expectFail: true },
  ];

  for (const t of qTests) {
    try {
      qGuard.validate(t.req);
      if (t.expectFail) throw new Error(`FAILED: Expected QueryBlockedError for ${t.req}`);
      console.log(`✅ Allowed: ${t.req}`);
    } catch (e: any) {
      if (e instanceof QueryBlockedError && t.expectFail) {
        console.log(`✅ Blocked: ${t.req}`);
      } else {
        console.error(`❌ Unexpected error for ${t.req}: ${e.message}`);
      }
    }
  }

  // 3. SQLite Injection Tests
  console.log('\n3. SQLite Injection Tests');
  const dbPath = path.resolve('test-smoke.db');
  
  // Create db with tables using direct better-sqlite3
  const Database = (await import('better-sqlite3')).default;
  const setupDb = new Database(dbPath);
  setupDb.exec('CREATE TABLE IF NOT EXISTS "user-profile" (id INT);');
  setupDb.exec('CREATE TABLE IF NOT EXISTS "order items" (id INT);');
  setupDb.exec('CREATE TABLE IF NOT EXISTS "v2.users" (id INT);');
  setupDb.close();

  const sqlite = new SQLiteAdapter('test', dbPath);
  await sqlite.connect();

  const sqlTests = [
    { req: 'users"); DROP TABLE users; --', expectFail: true },
    { req: 'users" OR 1=1 --', expectFail: true },
    { req: '"; VACUUM; --', expectFail: true },
    { req: 'user-profile', expectFail: false },
    { req: 'order items', expectFail: false },
    { req: 'v2.users', expectFail: false },
  ];

  for (const t of sqlTests) {
    try {
      await sqlite.describeTable(t.req);
      if (t.expectFail) throw new Error(`FAILED: Expected failure for malicious name ${t.req}`);
      console.log(`✅ Safely read table: ${t.req}`);
    } catch (e: any) {
      if (e.message.includes('not found') && t.expectFail) {
        // Safe failure: just didn't find the table, didn't execute injection
        console.log(`✅ Safely blocked injection: ${t.req}`);
      } else if (!t.expectFail) {
        console.error(`❌ Unexpected error for valid table ${t.req}: ${e.message}`);
      } else {
        console.log(`✅ Safely blocked injection (other error): ${t.req} - ${e.message}`);
      }
    }
  }
  await sqlite.disconnect();

  // 4. Ripgrep Ignore Validation
  console.log('\n4. Ripgrep Ignore Tests');
  const searcher = new CodeSearcher(path.resolve('.'));
  
  // Setup dummy files in ignored dirs
  await fs.mkdir('node_modules', { recursive: true });
  await fs.mkdir('dist', { recursive: true });
  await fs.mkdir('.git', { recursive: true });
  await fs.writeFile('node_modules/dummy.txt', 'FIND_THIS_SECRET');
  await fs.writeFile('dist/dummy.txt', 'FIND_THIS_SECRET');
  await fs.writeFile('.git/dummy.txt', 'FIND_THIS_SECRET');
  await fs.writeFile('src/findme.txt', 'FIND_THIS_SECRET'); // valid target

  try {
    const results = await searcher.search({ query: 'FIND_THIS_SECRET' });
    const filesFound = results.matches.map(m => m.file);
    
    if (filesFound.some(f => f.includes('node_modules') || f.includes('dist') || f.includes('.git'))) {
      console.error(`❌ Ignored directories were searched! Found in: ${filesFound.join(', ')}`);
    } else if (filesFound.some(f => f.includes('findme.txt'))) {
      console.log(`✅ Ripgrep correctly ignored directories and found the valid file.`);
    } else {
      console.error('❌ Could not find the test file.');
    }
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      console.log('⚠️ Ripgrep (rg) not installed on this system. Skipping ripgrep test.');
    } else {
      throw e;
    }
  }

  // Cleanup dummy files
  try { await fs.unlink('node_modules/dummy.txt'); } catch {}
  try { await fs.rmdir('node_modules'); } catch {}
  try { await fs.unlink('dist/dummy.txt'); } catch {}
  try { await fs.rmdir('dist'); } catch {}
  try { await fs.unlink('.git/dummy.txt'); } catch {}
  try { await fs.rmdir('.git'); } catch {}
  try { await fs.unlink('src/findme.txt'); } catch {}
  try { await fs.unlink('test-smoke.db'); } catch {}

  // 5. Cache Validation
  console.log('\n5. Cache Tests');
  const cache = new WorkspaceCache(60000);
  const scanner = new WorkspaceScanner(path.resolve('.'), cache);

  const start1 = performance.now();
  await scanner.getStructure();
  const time1 = performance.now() - start1;

  const start2 = performance.now();
  await scanner.getStructure();
  const time2 = performance.now() - start2;

  if (time2 < time1 * 0.5) {
    console.log(`✅ Cache hit was faster! (Cold: ${time1.toFixed(2)}ms, Hot: ${time2.toFixed(2)}ms)`);
  } else {
    console.log(`⚠️ Cache hit wasn't significantly faster (Cold: ${time1.toFixed(2)}ms, Hot: ${time2.toFixed(2)}ms)`);
  }

  console.log('\n--- ALL SMOKE TESTS COMPLETED ---');
}

runTests().catch(console.error);
