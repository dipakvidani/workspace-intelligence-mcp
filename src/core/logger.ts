import pino from 'pino';
import type { LogDomain } from '../types/common.types.js';

/* Logs to stderr (fd=2) to avoid conflicting with MCP stdio transport on stdout */
const rootLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      destination: 2,
    },
  },
});

export function createLogger(domain: LogDomain): pino.Logger {
  return rootLogger.child({ module: domain });
}

export { rootLogger };
