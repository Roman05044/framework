import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data', 'devices');
const backupBaseDir = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

export const createBackup = async () => {
  try {
    await fs.access(dataDir);
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    if (jsonFiles.length === 0) return;

    const timestamp = Date.now().toString();
    const currentBackupDir = path.join(backupBaseDir, timestamp);
    await fs.mkdir(currentBackupDir, { recursive: true });

    for (const file of jsonFiles) {
      await fs.copyFile(
        path.join(dataDir, file),
        path.join(currentBackupDir, file)
      );
    }
    console.log(`Backup created successfully: ${timestamp}`);

    const allBackups = await fs.readdir(backupBaseDir);
    allBackups.sort();

    if (allBackups.length > MAX_BACKUPS) {
      const backupsToDelete = allBackups.slice(
        0,
        allBackups.length - MAX_BACKUPS
      );
      for (const oldBackup of backupsToDelete) {
        await fs.rm(path.join(backupBaseDir, oldBackup), {
          recursive: true,
          force: true,
        });
        console.log(`Old backup removed: ${oldBackup}`);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Backup process failed:', error);
    }
  }
};
