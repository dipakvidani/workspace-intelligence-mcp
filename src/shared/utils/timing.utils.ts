export async function measureAsync<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, durationMs: performance.now() - start };
}

export function measureSync<T>(
  fn: () => T,
): { result: T; durationMs: number } {
  const start = performance.now();
  const result = fn();
  return { result, durationMs: performance.now() - start };
}
