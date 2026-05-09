import { Device } from '../db/models/device.model.js';

export class DeviceRepository {
  constructor(db) {
    this.db = db;
  }

  // Format the _id to id to keep the contract consistent
  _format(doc) {
    if (!doc) return null;
    const formatted = { ...doc, id: doc._id.toString() };
    delete formatted._id;
    return formatted;
  }

  async findPaginated(page, limit) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Device.find({}).skip(skip).limit(limit).lean(),
      Device.countDocuments({}),
    ]);

    return {
      data: data.map(this._format),
      total,
    };
  }

  async findAll() {
    const devices = await Device.find({}).lean();
    return devices.map(this._format);
  }

  async findById(id) {
    try {
      const device = await Device.findById(id).lean();
      return this._format(device);
    } catch {
      return null;
    }
  }

  async create(data) {
    const device = await Device.create(data);
    return this._format(device.toObject());
  }

  async update(id, updates) {
    try {
      const device = await Device.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      ).lean();
      return this._format(device);
    } catch {
      return null;
    }
  }

  async remove(id) {
    try {
      await Device.findByIdAndDelete(id);
      return true;
    } catch {
      return false;
    }
  }
}
