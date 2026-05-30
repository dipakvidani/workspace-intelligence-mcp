import type { z } from 'zod';
import type { Result } from './common.types.js';

export interface ToolDefinition<TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (input: unknown) => Promise<Result<TOutput>>;
}

export interface ToolMetadata {
  category: 'workspace' | 'database' | 'utility';
  name: string;
  description: string;
}
