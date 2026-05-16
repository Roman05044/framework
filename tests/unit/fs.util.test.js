import { describe, it, expect, vi } from 'vitest';
import * as fsUtil from '../../utils/fs.util.js';
import fs from 'fs/promises';

vi.mock('fs/promises');

describe('FS Util Unit Tests', () => {
  it('should write atomic', async () => {
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.rename.mockResolvedValue();

    await fsUtil.writeAtomic('test.json', { a: 1 });
    expect(fs.writeFile).toHaveBeenCalledWith('test.json.tmp.json', '{\n  "a": 1\n}', 'utf8');
    expect(fs.rename).toHaveBeenCalledWith('test.json.tmp.json', 'test.json');
  });

  it('should handle writeAtomic error and cleanup', async () => {
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockRejectedValue(new Error('Write failed'));
    fs.unlink.mockResolvedValue();
    await expect(fsUtil.writeAtomic('test.json', {})).rejects.toThrow('Write failed');
  });

  it('should handle writeAtomic error and ignore ENOENT on cleanup', async () => {
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockRejectedValue(new Error('Write failed'));
    const error = new Error();
    error.code = 'ENOENT';
    fs.unlink.mockRejectedValue(error);
    await expect(fsUtil.writeAtomic('test.json', {})).rejects.toThrow('Write failed');
  });

  it('should handle writeAtomic error and log other errors on cleanup', async () => {
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockRejectedValue(new Error('Write failed'));
    const error = new Error('Other');
    fs.unlink.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(fsUtil.writeAtomic('test.json', {})).rejects.toThrow('Write failed');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should read json file', async () => {
    fs.readFile.mockResolvedValue('{"test": true}');
    const result = await fsUtil.readJsonFile('test.json');
    expect(result).toEqual({ test: true });
  });

  it('should handle read json file enoent', async () => {
    const error = new Error();
    error.code = 'ENOENT';
    fs.readFile.mockRejectedValue(error);
    const result = await fsUtil.readJsonFile('notfound.json');
    expect(result).toBeNull();
  });

  it('should delete file', async () => {
    fs.unlink.mockResolvedValue();
    const result = await fsUtil.deleteFile('test.json');
    expect(result).toBe(true);
  });

  it('should handle delete file enoent', async () => {
    const error = new Error();
    error.code = 'ENOENT';
    fs.unlink.mockRejectedValue(error);
    const result = await fsUtil.deleteFile('notfound.json');
    expect(result).toBe(false);
  });
});
