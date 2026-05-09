import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.js';
import { DeviceRepository } from '../repositories/device.repository.js';
import deviceService from '../services/device.service.js';

async function drizzlePlugin(fastify) {
  if (!fastify.mysql) {
    throw new Error(
      'MySQL pool is not registered. Register mysql plugin before drizzle.'
    );
  }

  const db = drizzle(fastify.mysql, { schema, mode: 'default' });

  fastify.decorate('drizzle', db);

  const deviceRepo = new DeviceRepository(db);
  fastify.decorate('deviceRepo', deviceRepo);
  deviceService.setRepository(deviceRepo);

  fastify.addHook('onClose', async () => {
    fastify.log.info('Drizzle layer closed');
  });
}

export default fp(drizzlePlugin, {
  name: 'drizzle-plugin',
  dependencies: ['mysql-plugin'],
});
