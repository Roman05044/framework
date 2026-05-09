export class DeviceRepository {
  constructor(db) {
    this.db = db;
  }

  async findPaginated(page, limit) {
    const offset = (page - 1) * limit;
    
    const [rows] = await this.db.execute(
      'SELECT * FROM devices ORDER BY id ASC LIMIT ? OFFSET ?',
      [String(limit), String(offset)]
    );

    const [[{ total }]] = await this.db.execute(
      'SELECT COUNT(*) as total FROM devices'
    );

    return {
      data: rows,
      total: Number(total),
    };
  }

  async findAll() {
    const [rows] = await this.db.execute('SELECT * FROM devices');
    return rows;
  }

  async findById(id) {
    const [rows] = await this.db.execute(
      'SELECT * FROM devices WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async create(data) {
    const { device, status, room, description, image } = data;
    const [result] = await this.db.execute(
      'INSERT INTO devices (device, status, room, description, image) VALUES (?, ?, ?, ?, ?)',
      [
        device,
        status || 'off',
        room,
        description || '',
        image || null
      ]
    );
    
    return { id: result.insertId, device, status: status || 'off', room, description: description || '', image: image || null };
  }

  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };

    await this.db.execute(
      'UPDATE devices SET device=?, status=?, room=?, description=?, image=? WHERE id=?',
      [updated.device, updated.status, updated.room, updated.description, updated.image, id]
    );

    return updated;
  }

  async remove(id) {
    const [result] = await this.db.execute(
      'DELETE FROM devices WHERE id=?',
      [id]
    );
    return result.affectedRows > 0;
  }
}
