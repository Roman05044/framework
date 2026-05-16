import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildImageUrl } from '../../utils/url.util.js';
import { deviceEventBus } from '../../utils/event-bus.util.js';
import { getExternalDeviceType } from '../../utils/fetch.util.js';

// Mock global fetch
global.fetch = vi.fn();

describe('Utils Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('url.util.js', () => {
    it('should build image url correctly', () => {
      const req = { protocol: 'http', hostname: 'localhost' };
      const url = buildImageUrl(req, '/1/image.png');
      expect(url).toBe('http://localhost/uploads/1/image.png');
    });

    it('should return null if no relative path', () => {
      expect(buildImageUrl({}, null)).toBeNull();
    });
  });

  describe('event-bus.util.js', () => {
    it('should emit and listen to events', () => {
      const callback = vi.fn();
      deviceEventBus.on('test:event', callback);
      deviceEventBus.emit('test:event', { id: 1 });
      expect(callback).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('fetch.util.js', () => {
    it('should fetch external device type and cache it', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'sensor' }),
      });

      const result = await getExternalDeviceType('123', mockRedis);
      
      expect(result).toEqual({ type: 'sensor' });
      expect(mockRedis.get).toHaveBeenCalledWith('cache:reference:123');
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should return cached value if exists', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(JSON.stringify({ type: 'cached_sensor' })),
        set: vi.fn(),
      };

      const result = await getExternalDeviceType('123', mockRedis);
      
      expect(result).toEqual({ type: 'cached_sensor' });
      expect(global.fetch).not.toHaveBeenCalled(); // fetch shouldn't be called
    });
    
    it('should handle fetch failures gracefully', async () => {
      const mockRedis = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn(),
      };
      
      // Force fetch to fail 3 times (retries logic)
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await getExternalDeviceType('123', mockRedis);
      
      expect(result).toBeNull();
    });
  });
});
