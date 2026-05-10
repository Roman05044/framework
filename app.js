import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import { createAuthService } from './services/auth.service.js';
import { createAuthController } from './controllers/auth.controller.js';
import { REDIS_KEYS } from './constants/redis.js';
import authRoutes from '#routes/auth.routes';
import deviceRoutes from '#routes/device.routes';
import deviceRoutesV2 from '#routes/device.v2.routes';
import githubRoutes from '#routes/github.routes';
import healthRoutes from '#routes/health.routes';
import websocketRoutes from './routes/websocket.routes.js';
import path from 'path';
import { envSchema } from './schemas/env.schema.js';
import mysqlPlugin from './db/mysql.js';
import drizzlePlugin from './db/drizzle.js';
import redisPlugin from './db/redis.js';

export const buildApp = async () => {
  // eslint-disable-next-line no-process-env
  const env = process.env.NODE_ENV || 'development';
  const fastify = Fastify({
    logger: {
      level: env === 'production' ? 'error' : 'info',
      transport: env !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
  });

  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  await fastify.register(mysqlPlugin);
  await fastify.register(drizzlePlugin);
  await fastify.register(redisPlugin);

  await fastify.register(fastifyCookie);

  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    sign: { expiresIn: '15m' },
    trusted: async (request, decodedToken) => {
      if (!decodedToken.jti) return true;
      const isBlacklisted = await fastify.redis.get(
        REDIS_KEYS.BLACKLIST(decodedToken.jti)
      );
      return !isBlacklisted;
    },
  });

  fastify.decorate('verifyJwt', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  const authService = createAuthService({ db: fastify.drizzle });
  const authController = createAuthController(authService);
  fastify.decorate('authController', authController);

  await fastify.register(fastifyHelmet, { global: true });
  await fastify.register(fastifyCors, {
    origin: env === 'production' ? 'https://example.com' : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  await fastify.register(fastifySensible);

  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: fastify.redis,
  });

  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Smart Home API',
        version: '1.0.0',
      },
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Bearer <token>',
        },
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  await fastify.register(fastifyWebsocket);

  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(healthRoutes, { prefix: '/api/v1' });

  await fastify.register(deviceRoutes, { prefix: '/api/v1' });
  await fastify.register(deviceRoutesV2, { prefix: '/api/v2' });
  await fastify.register(githubRoutes, { prefix: '/api' });
  await fastify.register(websocketRoutes, { prefix: '/api/v1' });

  return fastify;
};
