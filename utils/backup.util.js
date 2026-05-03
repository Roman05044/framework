import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const dataDir = path.join(process.cwd(), 'data', 'devices');
const backupBaseDir = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

export const createBackup = async () => {
  try {
    await fs.access(dataDir);
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    if (jsonFiles.length === 0) return;

    await fs.mkdir(backupBaseDir, { recursive: true });

    const timestamp = Date.now().toString();
    const backupPath = path.join(backupBaseDir, `${timestamp}.gz`);

    const mergedStream = Readable.from(mergeFiles(jsonFiles));
    const gzipStream = createGzip();
    const outputStream = createWriteStream(backupPath);

    await pipeline(mergedStream, gzipStream, outputStream);

    console.log(`Gzip backup created: ${timestamp}.gz`);

    const allBackups = await fs.readdir(backupBaseDir);
    const gzBackups = allBackups.filter((f) => f.endsWith('.gz')).sort();

    if (gzBackups.length > MAX_BACKUPS) {
      const backupsToDelete = gzBackups.slice(
        0,
        gzBackups.length - MAX_BACKUPS
      );
      for (const oldBackup of backupsToDelete) {
        await fs.unlink(path.join(backupBaseDir, oldBackup));
        console.log(`Old backup removed: ${oldBackup}`);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Backup process failed:', error);
    }
  }
};

async function* mergeFiles(jsonFiles) {
  for (let i = 0; i < jsonFiles.length; i++) {
    const filePath = path.join(dataDir, jsonFiles[i]);
    const content = await fs.readFile(filePath, 'utf8');
    yield content;
    if (i < jsonFiles.length - 1) {
      yield '\n';
    }
  }
}
