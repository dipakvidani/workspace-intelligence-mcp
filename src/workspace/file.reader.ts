import { readFile as fsReadFile } from 'fs/promises';
import { BaseService } from '../base/base.service.js';
import { PathGuard } from '../safety/path.guard.js';
import { FileError } from '../core/errors.js';
import type { FileContent } from '../types/workspace.types.js';
import { getFileSize, isBinaryFile } from '../shared/utils/file.utils.js';
import { getExtension } from '../shared/utils/path.utils.js';
import { countLines, truncate } from '../shared/utils/string.utils.js';

export class FileReader extends BaseService {
  constructor(
    private readonly pathGuard: PathGuard,
    private readonly maxFileSize: number,
  ) {
    super('workspace');
  }

  async read(relativePath: string): Promise<FileContent> {
    const absolutePath = await this.pathGuard.resolveSafePath(relativePath);

    if (isBinaryFile(absolutePath)) {
      throw new FileError(`Binary file cannot be read as text: ${relativePath}`);
    }

    const size = await getFileSize(absolutePath);
    const truncated = size > this.maxFileSize;

    this.log.debug({ path: relativePath, size, truncated }, 'Reading file');

    const buffer = truncated
      ? await this.readPartial(absolutePath, this.maxFileSize)
      : await fsReadFile(absolutePath, 'utf-8');

    const content = truncated
      ? truncate(buffer, this.maxFileSize, '\n\n... [truncated]')
      : buffer;

    return {
      path: relativePath,
      content,
      size,
      extension: getExtension(absolutePath),
      lineCount: countLines(content),
      truncated,
    };
  }

  private async readPartial(filePath: string, maxBytes: number): Promise<string> {
    const { open } = await import('fs/promises');
    const handle = await open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(maxBytes);
      const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
      return buffer.subarray(0, bytesRead).toString('utf-8');
    } finally {
      await handle.close();
    }
  }
}
