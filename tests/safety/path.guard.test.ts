import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PathGuard } from '../../src/safety/path.guard.js';
import path from 'path';
import fs from 'fs/promises';

describe('PathGuard', () => {
  const root = path.resolve('/workspace');
  let guard: PathGuard;

  beforeEach(() => {
    guard = new PathGuard(root);
    // Mock realpath to just return the string by default
    vi.spyOn(fs, 'realpath').mockImplementation(async (p: string | Buffer | URL) => String(p));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveSafePath', () => {
    it('allows valid paths inside workspace', async () => {
      const target = 'src/index.ts';
      const result = await guard.resolveSafePath(target);
      expect(result).toBe(path.resolve(root, target));
    });

    it('allows accessing the root itself', async () => {
      const result = await guard.resolveSafePath('.');
      expect(result).toBe(root);
    });

    it('blocks traversal attempts outside workspace (..)', async () => {
      const target = '../../etc/passwd';
      await expect(guard.resolveSafePath(target)).rejects.toThrow(/Path traversal detected/);
    });

    it('blocks absolute paths outside workspace', async () => {
      const target = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc/shadow';
      await expect(guard.resolveSafePath(target)).rejects.toThrow(/Path traversal detected/);
    });

    it('blocks pseudo-root boundary bypass (e.g. /workspace2)', async () => {
      // e.g. path.resolve(/workspace, ../workspace2) => /workspace2
      const target = '../workspace2/secret.txt';
      await expect(guard.resolveSafePath(target)).rejects.toThrow(/Path traversal detected/);
    });

    it('handles simulated symlink escaping the workspace', async () => {
      // Mock realpath to simulate a symlink pointing outside
      vi.spyOn(fs, 'realpath').mockImplementation(async (p: string | Buffer | URL) => {
        const strP = String(p);
        if (strP.includes('link-out')) {
          return path.resolve('/etc/shadow');
        }
        return strP;
      });

      const target = 'link-out/file';
      await expect(guard.resolveSafePath(target)).rejects.toThrow(/Path traversal detected/);
    });

    it('allows simulated symlink inside the workspace', async () => {
      vi.spyOn(fs, 'realpath').mockImplementation(async (p: string | Buffer | URL) => {
        const strP = String(p);
        if (strP.includes('link-in')) {
          return path.resolve(root, 'actual-folder/file.ts');
        }
        return strP;
      });

      const target = 'link-in';
      const result = await guard.resolveSafePath(target);
      expect(result).toBe(path.resolve(root, 'actual-folder/file.ts'));
    });
    
    it('gracefully handles missing files by falling back to resolve', async () => {
       vi.spyOn(fs, 'realpath').mockImplementation(async (p: string | Buffer | URL) => {
         const strP = String(p);
         if (strP.includes('new-file.txt')) {
           throw new Error('ENOENT: no such file or directory');
         }
         return strP;
       });
       
       const target = 'new-file.txt';
       const result = await guard.resolveSafePath(target);
       expect(result).toBe(path.resolve(root, target));
    });
  });
});
