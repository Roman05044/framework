import { MESSAGES } from '#constants/messages';

const healthSchema = {
  description: 'Basic health check',
  tags: ['Health'],
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
      },
    },
  },
};

const healthDetailsSchema = {
  description: 'Detailed health check',
  tags: ['Health'],
  headers: {
    type: 'object',
    properties: {
      'x-api-key': { type: 'string', description: 'Admin API Key' },
    },
    required: ['x-api-key'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        pid: { type: 'integer' },
        nodeVersion: { type: 'string' },
        platform: { type: 'string' },
        uptime: { type: 'number' },
        memoryUsage: { type: 'object', additionalProperties: true },
      },
    },
  },
};

export default async function (fastify) {
  fastify.get('/health', { schema: healthSchema }, async () => {
    return { status: 'ok' };
  });

  fastify.get(
    '/health/details',
    {
      schema: healthDetailsSchema,
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
