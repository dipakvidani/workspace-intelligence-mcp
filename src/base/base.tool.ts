import { z } from 'zod';
import type { Result } from '../types/common.types.js';
import { RequestContext } from '../context/request.context.js';
import { success, failure } from '../core/result.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('tool');

/**
 * Abstract base for all MCP tools. Handles:
 * - Input validation via Zod
 * - RequestContext creation with timing
 * - Consistent Result<T> wrapping
 * - Error boundary (tools never crash the server)
 *
 * Subclasses only implement execute() with pure business logic.
 */
export abstract class BaseTool<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: z.ZodObject<z.ZodRawShape>;

  protected abstract execute(input: TInput, ctx: RequestContext): Promise<TOutput>;

  async run(rawInput: unknown, workspaceRoot: string): Promise<Result<TOutput>> {
    const ctx = RequestContext.create(this.name, workspaceRoot);
    try {
      const input = this.inputSchema.parse(rawInput) as TInput;
      log.debug({ tool: this.name, requestId: ctx.id }, 'Executing tool');
      const data = await this.execute(input, ctx);
      log.debug({ tool: this.name, duration: ctx.elapsed() }, 'Tool completed');
      return success(data, ctx.elapsed(), ctx.id);
    } catch (error) {
      const safeError = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      log.error({ tool: this.name, error: safeError, stack, duration: ctx.elapsed() }, 'Tool failed');
      return failure(error, ctx.elapsed(), ctx.id);
    }
  }
}
