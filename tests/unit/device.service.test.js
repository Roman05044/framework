import { describe, it, expect, vi, beforeEach } from 'vitest';
import deviceService from '../../services/device.service.js';

describe('Device Service Unit Tests', () => {
  let mockRepo;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn(),
      findPaginated: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    deviceService.setRepository(mockRepo);
  });

  it('should get all devices', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: 1, room: 'living room' }, { id: 2, room: 'kitchen' }]);
    
    const all = await deviceService.getDevices();
    expect(all).toHaveLength(2);
    
    const filtered = await deviceService.getDevices('kitchen');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(2);
  });

  it('should get paginated devices', async () => {
    mockRepo.findPaginated.mockResolvedValue({ data: [], total: 0 });
    await deviceService.getPaginatedDevices(1, 10);
    expect(mockRepo.findPaginated).toHaveBeenCalledWith(1, 10);
  });

  it('should get device by id', async () => {
    mockRepo.findById.mockResolvedValue({ id: 1 });
    const res = await deviceService.getDeviceById(1);
    expect(res.id).toBe(1);
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });

  it('should add a device', async () => {
    mockRepo.create.mockResolvedValue({ id: 1 });
    const res = await deviceService.addDevice({ name: 'test' });
    expect(res.id).toBe(1);
    expect(mockRepo.create).toHaveBeenCalledWith({ name: 'test' });
  });

  it('should update a device', async () => {
    mockRepo.update.mockResolvedValue({ id: 1 });
    const res = await deviceService.updateDevice(1, { name: 'test' });
    expect(res.id).toBe(1);
    expect(mockRepo.update).toHaveBeenCalledWith(1, { name: 'test' });
  });

  it('should delete a device', async () => {
    mockRepo.remove.mockResolvedValue(true);
    const res = await deviceService.deleteDevice(1);
    expect(res).toBe(true);
    expect(mockRepo.remove).toHaveBeenCalledWith(1);
  });

  it('should throw if repo not initialized', async () => {
    deviceService.setRepository(null);
    await expect(deviceService.getDevices()).rejects.toThrow('Repository not initialized');
  });
});
