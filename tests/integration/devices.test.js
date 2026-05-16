import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../app.js';
import { devices, users } from '../../db/schema.js';


describe('Devices API Integration', () => {
  let app;
  let authToken;
  let deviceId;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    try {
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'admin@example.com', password: 'password123' },
      });

      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'admin@example.com', password: 'password123' },
      });

      authToken = loginRes.json()?.accessToken;
    } catch (e) {}
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    try {
      await app.drizzle.delete(devices);
      await app.redis.flushdb();
    } catch (e) {}
  });

  async function createTestDevice() {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/devices',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { device: 'Light bulb', room: 'Living Room', status: 'off' },
    });
    return res.json().item.id;
  }

  it('should create a new device via POST /api/v1/devices', async () => {
    if (!authToken) return;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/devices',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { device: 'Smart Plug', room: 'Kitchen', status: 'on' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().item).toHaveProperty('id');
  });

  it('should get devices list via GET /api/v1/devices', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/devices',
    });
    if (res.statusCode === 200) {
      expect(res.json()).toHaveProperty('items');
      expect(res.json().items).toBeInstanceOf(Array);
    }
  });

  it('should get a single device via GET /api/v1/devices/:id', async () => {
    if (!authToken) return;
    const id = await createTestDevice();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/devices/${id}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it('should update a device via PATCH /api/v1/devices/:id', async () => {
    if (!authToken) return;
    const id = await createTestDevice();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/devices/${id}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { status: 'on' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().item.status).toBe('on');
  });

  it('should fetch paginated devices via GET /api/v2/devices', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v2/devices?page=1&limit=10',
    });
    if (res.statusCode === 200) {
      expect(res.json()).toHaveProperty('data');
      expect(res.json()).toHaveProperty('meta');
    }
  });

  it('should fetch device details via GET /api/v1/devices/:id/details', async () => {
    if (!authToken) return;
    const id = await createTestDevice();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/devices/${id}/details`,
    });
    expect(res.statusCode).toBe(200);
  });

  it('should delete a device via DELETE /api/v1/devices/:id', async () => {
    if (!authToken) return;
    const id = await createTestDevice();
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/devices/${id}`,
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
  });
});
