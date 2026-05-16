import { describe, it, expect, vi } from 'vitest';
import { createBackup } from '../../utils/backup.util.js';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

vi.mock('fs/promises');
vi.mock('fs', () => ({ createWriteStream: vi.fn() }));
vi.mock('stream/promises');

describe('Backup Util Unit Tests', () => {
  it('should create a backup', async () => {
    fs.access.mockResolvedValue(undefined);
    fs.readdir.mockImplementation(async (dir) => {
      if (dir.includes('devices')) return ['1.json'];
      if (dir.includes('backups')) return ['old.gz'];
      return [];
    });
    fs.mkdir.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue('{"a": 1}');
    
    createWriteStream.mockReturnValue({});
    pipeline.mockResolvedValue(undefined);

    await createBackup();
    expect(pipeline).toHaveBeenCalled();
  });

  it('should delete old backups', async () => {
    fs.access.mockResolvedValue(undefined);
    fs.readdir.mockImplementation(async (dir) => {
      if (dir.includes('devices')) return ['1.json'];
      if (dir.includes('backups')) return ['1.gz', '2.gz', '3.gz', '4.gz', '5.gz', '6.gz'];
      return [];
    });
    fs.unlink.mockResolvedValue(undefined);
    await createBackup();
    expect(fs.unlink).toHaveBeenCalled();
  });

  it('should handle errors except ENOENT', async () => {
    fs.access.mockRejectedValue(new Error('Some error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await createBackup();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
