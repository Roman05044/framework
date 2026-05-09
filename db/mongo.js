import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import { DeviceRepository } from '../repositories/device.repository.js';
import deviceService from '../services/device.service.js';

async function mongoPlugin(fastify) {
  try {
    await mongoose.connect(fastify.config.MONGO_URL, {
      dbName: fastify.config.MONGO_DB_NAME,
    });
    fastify.log.info('MongoDB connected');

    // Register mongoose
    fastify.decorate('mongoose', mongoose);

    // Initialize repository and inject it into the service
    const deviceRepo = new DeviceRepository(mongoose);
    fastify.decorate('deviceRepo', deviceRepo);
    deviceService.setRepository(deviceRepo);
  } catch (err) {
    fastify.log.error(err, 'MongoDB connection error');
    process.exit(1);
  }

  fastify.addHook('onClose', async () => {
    await mongoose.connection.close();
    fastify.log.info('MongoDB connection closed');
  });
}

export default fp(mongoPlugin);
