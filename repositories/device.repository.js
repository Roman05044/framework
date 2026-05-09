import { devices } from '../db/schema.js';
import { eq, count } from 'drizzle-orm';

export class DeviceRepository {
  constructor(db) {
    this.db = db;
  }

  async findPaginated(page, limit) {
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(devices)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await this.db.select({ total: count() }).from(devices);

    return {
      data: rows,
      total: Number(total),
    };
  }

  async findAll() {
    return await this.db.select().from(devices);
  }

  async findById(id) {
    const rows = await this.db.select().from(devices).where(eq(devices.id, id));

    return rows.length > 0 ? rows[0] : null;
  }

  async create(data) {
    const { device, status, room, description, image } = data;
    const values = {
      device,
      status: status || 'off',
      room,
      description: description || '',
      image: image || null,
    };

    const [result] = await this.db.insert(devices).values(values);
    return { id: result.insertId, ...values };
  }

  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };

    await this.db
      .update(devices)
      .set({
        device: updated.device,
        status: updated.status,
        room: updated.room,
        description: updated.description,
        image: updated.image,
      })
      .where(eq(devices.id, id));

    return updated;
  }

  async remove(id) {
    const [result] = await this.db.delete(devices).where(eq(devices.id, id));

    return result.affectedRows > 0;
  }
}
