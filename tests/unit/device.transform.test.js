import { describe, it, expect } from 'vitest';
import { DeviceActiveTransform } from '../../src/transforms/device.transform.js';

describe('Device Transform Unit Tests', () => {
  it('should add isActive property based on status', () => {
    const transform = new DeviceActiveTransform();
    let result = null;
    
    transform._transform({ status: 'on' }, 'utf8', (err, data) => {
      result = data;
    });
    expect(result).toEqual({ status: 'on', isActive: true });
    
    result = null;
    transform._transform({ status: 'off' }, 'utf8', (err, data) => {
      result = data;
    });
    expect(result).toEqual({ status: 'off', isActive: false });
  });
});
