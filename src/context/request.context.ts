import { randomUUID } from 'crypto';

export class RequestContext {
  readonly id: string;
  readonly tool: string;
  readonly startedAt: number;
  private readonly _workspaceRoot: string;

  private constructor(tool: string, workspaceRoot: string) {
    this.id = randomUUID();
    this.tool = tool;
    this.startedAt = performance.now();
    this._workspaceRoot = workspaceRoot;
  }

  static create(tool: string, workspaceRoot = ''): RequestContext {
    return new RequestContext(tool, workspaceRoot);
  }

  get workspaceRoot(): string {
    return this._workspaceRoot;
  }

  elapsed(): number {
    return performance.now() - this.startedAt;
  }
}
