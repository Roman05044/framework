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
import deviceRoutes from '#routes/device.routes';
import deviceRoutesV2 from '#routes/device.v2.routes';
import githubRoutes from '#routes/github.routes';
import healthRoutes from '#routes/health.routes';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { DeviceModel } from './models/device.model.js';

const envSchema = {
  type: 'object',
  required: ['PORT', 'HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY'],
  properties: {
    PORT: { type: 'integer', default: 3000 },
    HOSTNAME: { type: 'string', default: '127.0.0.1' },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production'],
      default: 'development',
    },
    ADMIN_API_KEY: { type: 'string' },
    GITHUB_TOKEN: { type: 'string' },
  },
};

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

  await fastify.register(fastifyHelmet, { global: true });
  await fastify.register(fastifyCors, {
    origin: env === 'production' ? 'https://example.com' : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  await fastify.register(fastifySensible);

  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Smart Home API',
        version: '1.0.0',
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

  await fastify.register(healthRoutes, { prefix: '/api/v1' });

  await fastify.register(deviceRoutes, { prefix: '/api/v1' });
  await fastify.register(deviceRoutesV2, { prefix: '/api/v2' });
  await fastify.register(githubRoutes, { prefix: '/api' });

  const checkMigrationStatus = async () => {
    try {
      const versionFile = path.join(process.cwd(), 'data', 'version.json');
      const currentHash = crypto
        .createHash('md5')
        .update(JSON.stringify(DeviceModel))
        .digest('hex');
      let savedHash = '';

      try {
        const versionData = await fs.readFile(versionFile, 'utf8');
        savedHash = JSON.parse(versionData).hash;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }

      if (currentHash !== savedHash) {
        fastify.log.warn(
          'Data schema changed. Run "npm run migrate" to update existing files.'
        );
      }
    } catch {
      fastify.log.error('Failed to check migration status');
    }
  };

  await checkMigrationStatus();

  return fastify;
};
