export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function countLines(str: string): number {
  if (!str) return 0;
  return str.split('\n').length;
}

export function sanitize(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}
