import { z } from 'zod';

const DatabaseConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['sqlite', 'postgres', 'mysql']),
  filePath: z.string().optional(),
  connectionString: z.string().optional(),
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

const ServiceOverrideSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  type: z.string().optional(),
  framework: z.string().optional(),
});

export const WorkspaceConfigSchema = z.object({
  workspaceRoot: z.string().min(1),
  ignoredFolders: z.array(z.string()).default([]),
  databases: z.array(DatabaseConfigSchema).default([]),
  services: z.array(ServiceOverrideSchema).default([]),
  maxFileSize: z.number().int().positive().optional(),
  maxSearchResults: z.number().int().positive().optional(),
  maxQueryRows: z.number().int().positive().optional(),
  cacheTimeoutMs: z.number().int().positive().optional(),
});

export type RawWorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;
