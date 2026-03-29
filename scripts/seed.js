import path from 'path';
import { writeAtomic } from '../utils/fs.util.js';
import { DeviceModel } from '../models/device.model.js';

const INITIAL_DEVICES = [
  {
    id: 1,
    device: 'Smart Lamp',
    status: 'on',
    room: 'Kitchen',
    description: 'RGB lamp over the table',
  },
  {
    id: 2,
    device: 'Air Conditioner',
    status: 'off',
    room: 'Living Room',
    description: 'Main AC unit',
  },
];

const dataDir = path.join(process.cwd(), 'data', 'devices');

const seedData = async () => {
  try {
    for (const item of INITIAL_DEVICES) {
      const newDevice = { ...DeviceModel, ...item };
      const filePath = path.join(dataDir, `${item.id}.json`);
      await writeAtomic(filePath, newDevice);
      console.log(`Created: ${filePath}`);
    }
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
};

seedData();
