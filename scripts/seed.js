import mongoose from 'mongoose';
import 'dotenv/config';
import { Device } from '../db/models/device.model.js';

const INITIAL_DEVICES = [
  {
    device: 'Smart Lamp',
    status: 'on',
    room: 'Kitchen',
    description: 'RGB lamp over the table',
  },
  {
    device: 'Air Conditioner',
    status: 'off',
    room: 'Living Room',
    description: 'Main AC unit',
  },
];

const isForce = process.argv.includes('--force');

const seedData = async () => {
  try {
    // eslint-disable-next-line no-process-env
    await mongoose.connect(process.env.MONGO_URL, {
      // eslint-disable-next-line no-process-env
      dbName: process.env.MONGO_DB_NAME,
    });
    console.log('Connected to MongoDB');

    const count = await Device.countDocuments();

    if (count > 0 && !isForce) {
      console.log('Database is not empty. Use --force to overwrite.');
      process.exit(0);
    }

    if (isForce) {
      await Device.deleteMany({});
      console.log('Cleared existing devices.');
    }

    await Device.insertMany(INITIAL_DEVICES);
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await mongoose.connection.close();
  }
};

seedData();
