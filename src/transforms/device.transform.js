import { Transform } from 'stream';

export class DeviceActiveTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(device, encoding, callback) {
    const transformed = {
      ...device,
      isActive: device.status === 'on',
    };
    callback(null, transformed);
  }
}
