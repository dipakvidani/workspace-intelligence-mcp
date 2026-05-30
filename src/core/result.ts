import type { Result, ResultMetadata, ResultError } from '../types/common.types.js';
import { AppError } from './errors.js';

function createMetadata(durationMs: number, requestId: string): ResultMetadata {
  return {
    duration_ms: Math.round(durationMs * 100) / 100,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function success<T>(data: T, durationMs: number, requestId: string): Result<T> {
  return { success: true, data, metadata: createMetadata(durationMs, requestId) };
}

export function failure<T = never>(error: unknown, durationMs: number, requestId: string): Result<T> {
  return { success: false, error: normalizeError(error), metadata: createMetadata(durationMs, requestId) };
}

function normalizeError(error: unknown): ResultError {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: 'INTERNAL_ERROR', message: error.message };
  }
  return { code: 'UNKNOWN_ERROR', message: String(error) };
}
