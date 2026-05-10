import { randomUUID } from 'node:crypto';
import { REDIS_KEYS } from '../constants/redis.js';

const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export function createAuthController(authService) {
  return {
    async register(request, reply) {
      const { email, password } = request.body;
      try {
        const user = await authService.register(email, password);
        reply.code(201);
        return { success: true, user };
      } catch (error) {
        if (error.message === 'Email is already registered') {
          throw reply.badRequest(error.message);
        }
        throw error;
      }
    },

    async login(request, reply) {
      const { email, password } = request.body;
      try {
        const user = await authService.login(email, password);

        const accessToken = await reply.jwtSign(
          { sub: user.id, email: user.email, jti: randomUUID() },
          { expiresIn: '15m' }
        );

        const refreshToken = await reply.jwtSign(
          { sub: user.id, jti: randomUUID() },
          { expiresIn: '7d' }
        );

        await request.server.redis.set(
          REDIS_KEYS.REFRESH(user.id),
          refreshToken,
          'EX',
          REFRESH_TTL
        );

        reply
          .setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: request.server.config.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
          })
          .send({ accessToken });
      } catch (error) {
        if (error.message === 'Invalid email or password') {
          throw reply.unauthorized(error.message);
        }
        throw error;
      }
    },

    async refresh(request, reply) {
      const refreshToken = request.cookies.refreshToken;

      if (!refreshToken) {
        throw reply.unauthorized('Refresh token is missing');
      }

      try {
        const decoded = request.server.jwt.verify(refreshToken);
        const userId = decoded.sub;

        const storedToken = await request.server.redis.get(
          REDIS_KEYS.REFRESH(userId)
        );

        if (!storedToken || storedToken !== refreshToken) {
          throw reply.unauthorized('Invalid refresh token');
        }

        const accessToken = await reply.jwtSign(
          { sub: userId, jti: randomUUID() },
          { expiresIn: '15m' }
        );

        return { accessToken };
      } catch (error) {
        if (error.statusCode) throw error;
        throw reply.unauthorized('Invalid refresh token');
      }
    },

    async logout(request, reply) {
      const { jti, exp, sub } = request.user;
      const currentTime = Math.floor(Date.now() / 1000);

      if (jti && exp > currentTime) {
        const ttl = exp - currentTime;
        await request.server.redis.set(
          REDIS_KEYS.BLACKLIST(jti),
          '1',
          'EX',
          ttl
        );
      }

      await request.server.redis.del(REDIS_KEYS.REFRESH(sub));

      reply
        .clearCookie('refreshToken', { path: '/auth/refresh' })
        .code(204)
        .send();
    },
  };
}
