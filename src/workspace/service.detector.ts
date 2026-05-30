import fg from 'fast-glob';
import path from 'path';
import { readFile } from 'fs/promises';
import { BaseService } from '../base/base.service.js';
import type { ServiceInfo } from '../types/workspace.types.js';
import type { ServiceType } from '../types/common.types.js';
import { WorkspaceCache } from '../cache/workspace.cache.js';
import {
  DEFAULT_IGNORED_GLOBS,
  SERVICE_INDICATORS,
  FRAMEWORK_INDICATORS,
} from '../shared/constants/workspace.constants.js';
import { normalizeSlashes } from '../shared/utils/path.utils.js';
import { fileExists } from '../shared/utils/file.utils.js';

export class ServiceDetector extends BaseService {
  constructor(
    private readonly workspaceRoot: string,
    private readonly cache: WorkspaceCache,
    private readonly ignoredGlobs: string[] = DEFAULT_IGNORED_GLOBS,
  ) {
    super('workspace');
  }

  async detect(): Promise<ServiceInfo[]> {
    const cached = this.cache.getServices(this.workspaceRoot);
    if (cached) return cached;

    this.log.info({ root: this.workspaceRoot }, 'Detecting services');

    const packageFiles = await fg('**/package.json', {
      cwd: this.workspaceRoot,
      ignore: this.ignoredGlobs,
      deep: 4,
    });

    const services: ServiceInfo[] = [];

    for (const pkgPath of packageFiles) {
      const serviceDir = path.dirname(pkgPath);
      const absoluteDir = path.join(this.workspaceRoot, serviceDir);
      const service = await this.analyzeService(absoluteDir, serviceDir);
      services.push(service);
    }

    if (services.length === 0) {
      const rootService = await this.analyzeService(this.workspaceRoot, '.');
      services.push(rootService);
    }

    this.cache.setServices(this.workspaceRoot, services);
    return services;
  }

  private async analyzeService(absoluteDir: string, relativePath: string): Promise<ServiceInfo> {
    const detectedBy: string[] = [];
    const languages: string[] = [];

    for (const [indicator, langs] of Object.entries(SERVICE_INDICATORS)) {
      if (await fileExists(path.join(absoluteDir, indicator))) {
        detectedBy.push(indicator);
        for (const lang of langs) {
          if (!languages.includes(lang)) languages.push(lang);
        }
      }
    }

    const framework = await this.detectFramework(absoluteDir);
    const serviceType = await this.inferServiceType(absoluteDir, framework);
    const hasDocker = await fileExists(path.join(absoluteDir, 'Dockerfile'));
    const hasPrisma = await fileExists(path.join(absoluteDir, 'prisma', 'schema.prisma'))
      || await fileExists(path.join(absoluteDir, 'schema.prisma'));
    const hasTests = await this.hasTestDirectory(absoluteDir);

    const name = await this.getServiceName(absoluteDir, relativePath);

    return {
      name,
      path: normalizeSlashes(relativePath),
      type: serviceType,
      detectedBy,
      framework: framework || undefined,
      language: languages[0] || undefined,
      hasDocker,
      hasPrisma,
      hasTests,
    };
  }

  private async detectFramework(dir: string): Promise<string | null> {
    const files = await fg('*', { cwd: dir, onlyFiles: true, deep: 1 });

    for (const file of files) {
      for (const [pattern, framework] of Object.entries(FRAMEWORK_INDICATORS)) {
        if (file.startsWith(pattern)) return framework;
      }
    }

    return null;
  }

  private async inferServiceType(dir: string, framework: string | null): Promise<ServiceType> {
    const frontendFrameworks = ['Next.js', 'Nuxt', 'Vite', 'Angular', 'SvelteKit', 'Gatsby', 'Astro'];
    const backendFrameworks = ['NestJS'];

    if (framework && frontendFrameworks.includes(framework)) return 'frontend';
    if (framework && backendFrameworks.includes(framework)) return 'backend';

    const pkgPath = path.join(dir, 'package.json');
    if (await fileExists(pkgPath)) {
      try {
        const raw = await readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw) as Record<string, unknown>;
        const deps = { ...pkg.dependencies as Record<string, string> ?? {} };

        if (deps['express'] || deps['fastify'] || deps['koa'] || deps['hapi']) return 'backend';
        if (deps['react'] || deps['vue'] || deps['svelte'] || deps['angular']) return 'frontend';
      } catch {
        /* Non-critical — fall through */
      }
    }

    return 'unknown';
  }

  private async hasTestDirectory(dir: string): Promise<boolean> {
    const testDirs = ['__tests__', 'test', 'tests', 'spec'];
    for (const td of testDirs) {
      if (await fileExists(path.join(dir, td))) return true;
    }
    return false;
  }

  private async getServiceName(dir: string, relativePath: string): Promise<string> {
    const pkgPath = path.join(dir, 'package.json');
    if (await fileExists(pkgPath)) {
      try {
        const raw = await readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw) as { name?: string };
        if (pkg.name) return pkg.name;
      } catch {
        /* Fall through to dirname */
      }
    }
    return path.basename(dir) || path.basename(relativePath);
  }
}
