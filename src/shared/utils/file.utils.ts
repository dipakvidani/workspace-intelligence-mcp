import { stat } from 'fs/promises';
import { BINARY_EXTENSIONS } from '../constants/workspace.constants.js';
import { getExtension } from './path.utils.js';

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export function isBinaryFile(filePath: string): boolean {
  return BINARY_EXTENSIONS.has(getExtension(filePath));
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
