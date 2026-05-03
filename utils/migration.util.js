import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { DeviceModel } from '../models/device.model.js';

export const checkMigrationStatus = async (fastify) => {
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

export default checkMigrationStatus;
