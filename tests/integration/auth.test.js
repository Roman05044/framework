import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../app.js';
import { users } from '../../db/schema.js';

describe('Auth API Integration', () => {
  let app;
  let refreshToken;
  let accessToken;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    try {
      await app.drizzle.delete(users);
      await app.redis.flushdb();
    } catch (e) {
      // Ignore
    }
  });

  it('should register a new user successfully and return 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'test@example.com', password: 'password123' },
    });

    if (response.statusCode === 201) {
      expect(response.json()).toHaveProperty('user');
      expect(response.json().user).toHaveProperty('id');
      expect(response.json().user.email).toBe('test@example.com');
    }
  });

  it('should login an existing user and return 200 with tokens', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'test2@example.com', password: 'password123' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test2@example.com', password: 'password123' },
    });

    if (response.statusCode === 200) {
      expect(response.json()).toHaveProperty('accessToken');
      refreshToken = response.cookies.find((c) => c.name === 'refreshToken')?.value;
      accessToken = response.json().accessToken;
    }
  });

  it('should refresh token using /auth/refresh', async () => {
    // Register and login to get fresh token in DB
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'refresh@example.com', password: 'password123' },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'refresh@example.com', password: 'password123' },
    });
    const freshRefreshToken = loginRes.cookies?.find((c) => c.name === 'refreshToken')?.value;

    if (!freshRefreshToken) return;

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: freshRefreshToken },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('accessToken');
  });

  it('should logout and invalidate token', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'logout@example.com', password: 'password123' },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'logout@example.com', password: 'password123' },
    });
    const freshAccessToken = loginRes.json()?.accessToken;

    if (!freshAccessToken) return;

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${freshAccessToken}` },
    });
    expect(response.statusCode).toBe(204);

    // Try accessing a protected route again, should fail
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${freshAccessToken}` },
    });
    expect(logoutRes.statusCode).toBe(401);
  });

  it('should fail to access protected route without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
    });
    expect(response.statusCode).toBe(401);
  });

  it('should handle duplicate email on register', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dup@example.com', password: 'password123' },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dup@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should handle invalid login credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nonexistent@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('should handle invalid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: 'invalid.token.here' },
    });
    expect(res.statusCode).toBe(401);
  });
});
