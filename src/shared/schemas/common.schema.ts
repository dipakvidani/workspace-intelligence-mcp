import { z } from 'zod';

export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
}).partial();

export const DatabaseNameSchema = z.object({
  database: z.string().min(1).describe('Database name as defined in config'),
});

export const TableNameSchema = z.object({
  database: z.string().min(1).describe('Database name as defined in config'),
  table: z.string().min(1).describe('Table name to inspect'),
});

export const FilePathSchema = z.object({
  path: z.string().min(1).describe('Relative file path within workspace'),
});
