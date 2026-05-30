import type pino from 'pino';
import type { LogDomain } from '../types/common.types.js';
import { createLogger } from '../core/logger.js';

/**
 * Base class for domain services providing structured logging.
 * Extend this for workspace, database, and cache services.
 */
export abstract class BaseService {
  protected readonly log: pino.Logger;

  constructor(domain: LogDomain) {
    this.log = createLogger(domain);
  }
}
