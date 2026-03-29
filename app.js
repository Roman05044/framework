import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static'; // ДОДАНО
import deviceRoutes from '#routes/device.routes';
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

  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  // ДОДАНО: Реєструємо плагін для статики
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({ err: error, method: request.method, url: request.url });
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: error.message,
    });
  });

  await fastify.register(healthRoutes);
  await fastify.register(deviceRoutes);

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
