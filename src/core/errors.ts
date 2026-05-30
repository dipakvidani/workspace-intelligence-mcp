export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PathTraversalError extends AppError {
  constructor(path: string) {
    super(`Path traversal blocked: ${path}`, 'PATH_TRAVERSAL', 403);
  }
}

export class QueryBlockedError extends AppError {
  constructor(reason: string) {
    super(`Query blocked: ${reason}`, 'QUERY_BLOCKED', 403);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DB_ERROR', 500);
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', 500);
  }
}

export class FileError extends AppError {
  constructor(message: string, code = 'FILE_ERROR') {
    super(message, code, 400);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}
