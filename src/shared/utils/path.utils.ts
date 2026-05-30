import path from 'path';

/* Resolve and validate that targetPath stays inside workspaceRoot */
export function resolveSafePath(workspaceRoot: string, targetPath: string): string {
  const resolved = path.resolve(workspaceRoot, targetPath);
  const normalized = path.normalize(resolved);

  if (!normalized.startsWith(path.normalize(workspaceRoot))) {
    throw new Error(`Path traversal detected: ${targetPath}`);
  }

  return normalized;
}

export function getRelativePath(workspaceRoot: string, absolutePath: string): string {
  return path.relative(workspaceRoot, absolutePath);
}

export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function getBaseName(filePath: string): string {
  return path.basename(filePath);
}

export function normalizeSlashes(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}
