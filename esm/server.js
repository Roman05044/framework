import Fastify from 'fastify';
import config from '#config/config';
import deviceRoutes from '#routes/device.routes';

const fastify = Fastify({
  logger: true,
});

fastify.register(deviceRoutes);

fastify.get('/health', async () => {
  return {
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
  };
});

const start = async () => {
  try {
    await fastify.listen({
      port: config.PORT,
      host: config.HOSTNAME,
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
;
