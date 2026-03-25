import { buildApp } from './app.js';

const start = async () => {
  try {
    const fastify = await buildApp();

    fastify.addHook('onClose', async (instance) => {
      instance.log.info('Server closed');
    });

    await fastify.listen({
      port: fastify.config.PORT,
      host: fastify.config.HOSTNAME,
    });

    const gracefulShutdown = async (signal) => {
      fastify.log.info(`Received signal: ${signal}`);
      setTimeout(() => process.exit(1), 10000).unref();
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(promise, reason);
  process.exit(1);
});

start();
