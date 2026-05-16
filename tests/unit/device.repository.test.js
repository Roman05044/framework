import { describe, it, expect, vi } from 'vitest';
import { DeviceRepository } from '../../repositories/device.repository.js';
import { devices } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

describe('Device Repository Unit Tests', () => {
  it('should call db methods', async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ affectedRows: 1 }])
      }),
    };
    
    // Override select for findAll
    const selectChain = {
      from: vi.fn().mockResolvedValue([{ id: 1 }])
    };
    
    const repo = new DeviceRepository(mockDb);
    
    // Mock for findAll
    mockDb.select.mockReturnValueOnce(selectChain);
    await repo.findAll();
    
    // Mock for findById
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 1 }])
      })
    });
    await repo.findById(1);
    
    // Mock for create
    await repo.create({ device: 'test' });
    
    // Mock for update
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 1 }])
      })
    });
    await repo.update(1, { status: 'on' });
    
    // Mock for remove
    await repo.remove(1);
    
    // Mock for findPaginated
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          offset: vi.fn().mockResolvedValue([])
        })
      })
    });
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockResolvedValue([{ total: 10 }])
    });
    await repo.findPaginated(1, 10);
    
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
