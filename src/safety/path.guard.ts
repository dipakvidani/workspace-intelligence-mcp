import fs from "fs/promises";
import path from "path";

export class PathGuard {
  constructor(private workspaceRoot: string) {}

  /**
   * Ensures a requested path is safe and inside workspace root.
   * Resolves symlinks and normalizes cross-platform differences.
   */
  async resolveSafePath(requestedPath: string): Promise<string> {
    // 1. Resolve workspace root to real path once
    const realWorkspaceRoot = await fs.realpath(
      path.resolve(this.workspaceRoot)
    );

    // 2. Resolve requested path (do NOT trust raw input)
    const absoluteRequested = path.resolve(this.workspaceRoot, requestedPath);

    // 3. Resolve symlinks on requested path (critical fix)
    let realRequested: string;
    try {
      realRequested = await fs.realpath(absoluteRequested);
    } catch {
      // If file doesn't exist yet, fallback to resolved path
      realRequested = absoluteRequested;
    }

    // 4. Normalize both paths
    const normalizedRoot = this.normalizePath(realWorkspaceRoot);
    const normalizedTarget = this.normalizePath(realRequested);

    // 5. Security boundary check
    if (!this.isInside(normalizedTarget, normalizedRoot)) {
      throw new Error(
        `Path traversal detected: ${requestedPath} escapes workspace boundary`
      );
    }

    return realRequested;
  }

  /**
   * Cross-platform normalization
   */
  private normalizePath(p: string): string {
    let normalized = path.resolve(p);

    // Windows case-insensitivity handling
    if (process.platform === "win32") {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  /**
   * Safe boundary check (prevents /app-root2 escaping /app-root issue)
   */
  private isInside(target: string, root: string): boolean {
    const relative = path.relative(root, target);

    return (
      relative === '' ||
      (!relative.startsWith("..") && !path.isAbsolute(relative))
    );
  }
}
