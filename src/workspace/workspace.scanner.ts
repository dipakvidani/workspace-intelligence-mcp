import fg from 'fast-glob';
import path from 'path';
import { BaseService } from '../base/base.service.js';
import type { DirectoryNode, WorkspaceStructure } from '../types/workspace.types.js';
import { WorkspaceCache } from '../cache/workspace.cache.js';
import { DEFAULT_IGNORED_GLOBS, DEFAULT_MAX_TREE_DEPTH } from '../shared/constants/workspace.constants.js';
import { normalizeSlashes } from '../shared/utils/path.utils.js';

export class WorkspaceScanner extends BaseService {
  constructor(
    private readonly workspaceRoot: string,
    private readonly cache: WorkspaceCache,
    private readonly ignoredGlobs: string[] = DEFAULT_IGNORED_GLOBS,
    private readonly maxDepth: number = DEFAULT_MAX_TREE_DEPTH,
  ) {
    super('workspace');
  }

  async getStructure(): Promise<WorkspaceStructure> {
    const cached = this.cache.getStructure(this.workspaceRoot);
    if (cached) return cached;

    this.log.info({ root: this.workspaceRoot }, 'Scanning workspace structure');

    const entries = await fg('**/*', {
      cwd: this.workspaceRoot,
      dot: false,
      onlyFiles: false,
      markDirectories: true,
      ignore: this.ignoredGlobs,
      deep: this.maxDepth,
    });

    let totalFiles = 0;
    let totalDirs = 0;
    const tree = this.buildTree(entries);

    this.countNodes(tree, (isDir) => {
      if (isDir) totalDirs++;
      else totalFiles++;
    });

    const structure: WorkspaceStructure = {
      root: normalizeSlashes(this.workspaceRoot),
      totalFiles,
      totalDirs,
      tree,
    };

    this.cache.setStructure(this.workspaceRoot, structure);
    return structure;
  }

  private buildTree(entries: string[]): DirectoryNode {
    const root: DirectoryNode = {
      name: path.basename(this.workspaceRoot),
      path: '.',
      type: 'directory',
      children: [],
    };

    const dirMap = new Map<string, DirectoryNode>();
    dirMap.set('.', root);

    const sorted = [...entries].sort();

    for (const entry of sorted) {
      const isDir = entry.endsWith('/');
      const cleanPath = isDir ? entry.slice(0, -1) : entry;
      const parentPath = path.dirname(cleanPath);
      const name = path.basename(cleanPath);

      const node: DirectoryNode = {
        name,
        path: normalizeSlashes(cleanPath),
        type: isDir ? 'directory' : 'file',
        ...(isDir ? { children: [] } : {}),
        ...(!isDir ? { extension: path.extname(name).toLowerCase() || undefined } : {}),
      };

      if (isDir) {
        dirMap.set(cleanPath, node);
      }

      const parent = this.ensureParent(dirMap, parentPath === '.' ? '.' : parentPath);
      if (parent.children) {
        parent.children.push(node);
      }
    }

    return root;
  }

  private ensureParent(dirMap: Map<string, DirectoryNode>, parentPath: string): DirectoryNode {
    if (dirMap.has(parentPath)) return dirMap.get(parentPath)!;
    
    // Create missing intermediate directory
    const node: DirectoryNode = { name: path.basename(parentPath), path: parentPath, type: 'directory', children: [] };
    dirMap.set(parentPath, node);
    
    if (parentPath !== '.') {
      const grandparent = this.ensureParent(dirMap, path.dirname(parentPath));
      if (grandparent.children) {
        grandparent.children.push(node);
      }
    }
    return node;
  }

  private countNodes(node: DirectoryNode, counter: (isDir: boolean) => void): void {
    counter(node.type === 'directory');
    if (node.children) {
      for (const child of node.children) {
        this.countNodes(child, counter);
      }
    }
  }
}
