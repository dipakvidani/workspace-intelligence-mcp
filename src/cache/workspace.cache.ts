import { CacheManager } from './cache.manager.js';
import type { WorkspaceStructure, ServiceInfo } from '../types/workspace.types.js';

export class WorkspaceCache {
  private readonly structureCache: CacheManager<WorkspaceStructure>;
  private readonly filesCache: CacheManager<string[]>;
  private readonly servicesCache: CacheManager<ServiceInfo[]>;

  constructor(ttlMs: number) {
    this.structureCache = new CacheManager(ttlMs);
    this.filesCache = new CacheManager(ttlMs);
    this.servicesCache = new CacheManager(ttlMs);
  }

  getStructure(root: string): WorkspaceStructure | undefined {
    return this.structureCache.get(root);
  }

  setStructure(root: string, structure: WorkspaceStructure): void {
    this.structureCache.set(root, structure);
  }

  getFiles(key: string): string[] | undefined {
    return this.filesCache.get(key);
  }

  setFiles(key: string, files: string[]): void {
    this.filesCache.set(key, files);
  }

  getServices(root: string): ServiceInfo[] | undefined {
    return this.servicesCache.get(root);
  }

  setServices(root: string, services: ServiceInfo[]): void {
    this.servicesCache.set(root, services);
  }

  invalidateAll(): void {
    this.structureCache.invalidate();
    this.filesCache.invalidate();
    this.servicesCache.invalidate();
  }
}
