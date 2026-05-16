import { describe, it, expect, vi } from 'vitest';
import deviceController from '../../controllers/device.controller.js';
import deviceService from '../../services/device.service.js';
import { getExternalDeviceType } from '../../utils/fetch.util.js';
import fs from 'fs/promises';

vi.mock('../../services/device.service.js');
vi.mock('../../utils/fetch.util.js');
vi.mock('fs/promises');

describe('Device Controller Unit Tests', () => {
  it('getAll should return formatted items', async () => {
    deviceService.getDevices.mockResolvedValue([{ image: '/test.png' }]);
    const req = { query: {}, protocol: 'http', hostname: 'localhost' };
    const res = await deviceController.getAll(req);
    expect(res.count).toBe(1);
    expect(res.items[0].image).toBe('http://localhost/uploads/test.png');
  });

  it('getOne should return 404 if not found', async () => {
    deviceService.getDeviceById.mockResolvedValue(null);
    const reply = { notFound: vi.fn().mockReturnValue(new Error('Not found')) };
    await expect(deviceController.getOne({ params: { id: 1 } }, reply)).rejects.toThrow();
  });

  it('getAllV2 should use cache', async () => {
    const req = {
      query: { page: 1, limit: 10 },
      server: { redis: { get: vi.fn().mockResolvedValue('{"data":[]}'), set: vi.fn() } },
    };
    const res = await deviceController.getAllV2(req);
    expect(res.data).toEqual([]);
  });

  it('exportCsv should send stream', async () => {
    fs.readdir.mockResolvedValue(['1.json']);
    fs.readFile.mockResolvedValue('{"device": "test"}');
    const req = { query: { transform: 'false' } };
    const reply = {
      header: vi.fn(),
      send: vi.fn().mockImplementation((stream) => stream),
    };
    const res = await deviceController.exportCsv(req, reply);
    expect(reply.send).toHaveBeenCalled();
  });

  it('streamNdjson should send stream', async () => {
    fs.readdir.mockResolvedValue(['1.json']);
    fs.readFile.mockResolvedValue('{"device": "test"}');
    const reply = {
      type: vi.fn(),
      send: vi.fn().mockImplementation((stream) => stream),
    };
    const res = await deviceController.streamNdjson({}, reply);
    expect(reply.send).toHaveBeenCalled();
  });

  it('importData should handle json', async () => {
    const req = {
      file: vi.fn().mockResolvedValue({
        mimetype: 'application/json',
        filename: 'data.json',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('[{"device":"test"}]')),
      }),
      server: { redis: { keys: vi.fn().mockResolvedValue([]), del: vi.fn() } },
    };
    deviceService.addDevice.mockResolvedValue({});
    const res = await deviceController.importData(req, {});
    expect(res.imported).toBe(1);
  });

  it('create should return 201', async () => {
    deviceService.addDevice.mockResolvedValue({ id: 1 });
    const req = { body: {}, server: { redis: { keys: vi.fn().mockResolvedValue([]), del: vi.fn() } } };
    const reply = { code: vi.fn() };
    const res = await deviceController.create(req, reply);
    expect(reply.code).toHaveBeenCalledWith(201);
  });

  it('getBackup should throw if unauthorized', async () => {
    const req = { headers: {}, server: { config: { ADMIN_API_KEY: 'secret' } } };
    const reply = { unauthorized: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.getBackup(req, reply)).rejects.toThrow();
  });

  it('update should throw not found if item missing', async () => {
    deviceService.updateDevice.mockResolvedValue(null);
    const reply = { notFound: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.update({ params: { id: 1 } }, reply)).rejects.toThrow();
  });

  it('remove should throw not found if item missing', async () => {
    deviceService.deleteDevice.mockResolvedValue(false);
    const reply = { notFound: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.remove({ params: { id: 1 } }, reply)).rejects.toThrow();
  });

  it('uploadImage should throw if no file', async () => {
    const req = { file: vi.fn().mockResolvedValue(null), params: { id: 1 } };
    const reply = { badRequest: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.uploadImage(req, reply)).rejects.toThrow();
  });

  it('uploadImage should throw if invalid mimetype', async () => {
    const req = { file: vi.fn().mockResolvedValue({ mimetype: 'text/plain' }), params: { id: 1 } };
    const reply = { badRequest: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.uploadImage(req, reply)).rejects.toThrow();
  });

  it('uploadImage should throw if device not found', async () => {
    const req = { file: vi.fn().mockResolvedValue({ mimetype: 'image/png', filename: '1.png' }), params: { id: 1 } };
    deviceService.getDeviceById.mockResolvedValue(null);
    const reply = { notFound: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.uploadImage(req, reply)).rejects.toThrow();
  });

  it('importData should throw if no file', async () => {
    const req = { file: vi.fn().mockResolvedValue(null) };
    const reply = { badRequest: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.importData(req, reply)).rejects.toThrow();
  });

  it('importData should throw if invalid mimetype', async () => {
    const req = { file: vi.fn().mockResolvedValue({ mimetype: 'text/plain' }) };
    const reply = { badRequest: vi.fn().mockReturnValue(new Error()) };
    await expect(deviceController.importData(req, reply)).rejects.toThrow();
  });

  it('importData should handle csv', async () => {
    const req = {
      file: vi.fn().mockResolvedValue({
        mimetype: 'text/csv',
        filename: 'data.csv',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('device,room,status\ntest,living room,on')),
      }),
      server: { redis: { keys: vi.fn().mockResolvedValue([]), del: vi.fn() } },
    };
    deviceService.addDevice.mockResolvedValue({});
    const res = await deviceController.importData(req, {});
    expect(res.imported).toBe(1);
  });

  it('exportCsv should send stream with transform', async () => {
    fs.readdir.mockResolvedValue(['1.json']);
    fs.readFile.mockResolvedValue('{"device": "test"}');
    const req = { query: { transform: 'true' } };
    const reply = {
      header: vi.fn(),
      send: vi.fn().mockImplementation((stream) => stream),
    };
    const res = await deviceController.exportCsv(req, reply);
    expect(reply.send).toHaveBeenCalled();
  });

  it('getAllV2 should handle cache miss', async () => {
    const req = {
      query: { page: 1, limit: 10 },
      server: { redis: { get: vi.fn().mockResolvedValue(null), set: vi.fn() } },
    };
    deviceService.getPaginatedDevices.mockResolvedValue({ data: [], total: 0 });
    const res = await deviceController.getAllV2(req);
    expect(res.data).toEqual([]);
    expect(req.server.redis.set).toHaveBeenCalled();
  });
});
