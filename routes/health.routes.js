import { MESSAGES } from '#constants/messages';

export default async function (fastify) {
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  fastify.get(
    '/health/details',
    {
      onRequest: async (request) => {
        const apiKey = request.headers['x-api-key'];
        if (apiKey !== fastify.config.ADMIN_API_KEY) {
          throw fastify.httpErrors.unauthorized(MESSAGES.UNAUTHORIZED);
        }
      },
    },
    async () => {
      return {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };
    }
  );
}
