import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { DeviceModel } from '../models/device.model.js';
import { writeAtomic, readJsonFile } from '../utils/fs.util.js';

const dataDir = path.join(process.cwd(), 'data', 'devices');
const versionFile = path.join(process.cwd(), 'data', 'version.json');

const computeHash = (obj) => {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
};

const migrate = async () => {
  try {
    const currentHash = computeHash(DeviceModel);
    let savedVersion = { hash: '' };

    try {
      const versionData = await fs.readFile(versionFile, 'utf8');
      savedVersion = JSON.parse(versionData);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    if (savedVersion.hash === currentHash) {
      console.log('Migration not required. Hashes match.');
      return;
    }

    console.log('Data schema changed. Starting migration...');

    await fs.mkdir(dataDir, { recursive: true });
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file);
      const currentData = await readJsonFile(filePath);

      if (currentData) {
        const migratedData = { ...DeviceModel, ...currentData };
        await writeAtomic(filePath, migratedData);
        console.log(`Migrated: ${file}`);
      }
    }

    await fs.mkdir(path.dirname(versionFile), { recursive: true });
    await fs.writeFile(
      versionFile,
      JSON.stringify({ hash: currentHash }),
      'utf8'
    );
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
