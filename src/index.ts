import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { createLogger } from './core/logger.js';

const log = createLogger('server');

async function main(): Promise<void> {
  try {
    const { server, config, dbManager } = await createServer();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    log.info({ root: config.workspaceRoot }, 'Dev Workspace Assistant MCP server running on stdio');

    /* Graceful shutdown */
    const shutdown = async () => {
      log.info('Shutting down...');
      await dbManager.disconnectAll();
      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      log.fatal({ error }, 'Uncaught exception');
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      log.error({ reason }, 'Unhandled rejection');
    });
  } catch (error) {
    log.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

main();
