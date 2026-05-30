import { readFile } from 'fs/promises';
import path from 'path';
import { WorkspaceConfigSchema } from './config.schema.js';
import { getDefaultConfig } from './defaults.js';
import { createLogger } from '../core/logger.js';
import { ConfigError } from '../core/errors.js';
import type { WorkspaceConfig } from '../types/config.types.js';
import { fileExists } from '../shared/utils/file.utils.js';

const log = createLogger('config');
const CONFIG_FILENAME = 'workspace.config.json';

let cachedConfig: WorkspaceConfig | null = null;

export async function loadConfig(workspaceRoot?: string): Promise<WorkspaceConfig> {
  if (cachedConfig) return cachedConfig;

  const root = resolveWorkspaceRoot(workspaceRoot);
  const configPath = path.join(root, CONFIG_FILENAME);

  if (await fileExists(configPath)) {
    log.info({ configPath }, 'Loading workspace config from file');
    cachedConfig = await loadFromFile(configPath, root);
  } else {
    log.info({ root }, 'No config file found, using auto-detected defaults');
    cachedConfig = getDefaultConfig(root);
  }

  return cachedConfig;
}

export function getConfig(): WorkspaceConfig {
  if (!cachedConfig) {
    throw new ConfigError('Config not loaded. Call loadConfig() first.');
  }
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}

async function loadFromFile(configPath: string, fallbackRoot: string): Promise<WorkspaceConfig> {
  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = WorkspaceConfigSchema.parse(parsed);

    const defaults = getDefaultConfig(validated.workspaceRoot || fallbackRoot);

    return {
      ...defaults,
      ...validated,
      ignoredFolders: validated.ignoredFolders.length > 0
        ? validated.ignoredFolders
        : defaults.ignoredFolders,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigError(`Invalid JSON in ${configPath}: ${error.message}`);
    }
    throw error;
  }
}

function resolveWorkspaceRoot(explicit?: string): string {
  if (explicit) return path.resolve(explicit);
  if (process.env.WORKSPACE_ROOT) return path.resolve(process.env.WORKSPACE_ROOT);
  return process.cwd();
}
