import { authBodySchema } from '../schemas/auth.schema.js';

export default async function authRoutes(fastify) {
  const authController = fastify.authController;

  fastify.post(
    '/register',
    {
      schema: {
        body: authBodySchema,
        tags: ['auth'],
        summary: 'Register a new user',
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    authController.register
  );

  fastify.post(
    '/login',
    {
      schema: {
        body: authBodySchema,
        tags: ['auth'],
        summary: 'Login user - returns access token in body, refresh token in httpOnly cookie',
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
            },
          },
        },
      },
    },
    authController.login
  );

  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Refresh access token using refresh token from cookie',
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
            },
          },
        },
      },
    },
    authController.refresh
  );

  fastify.post(
    '/logout',
    {
      onRequest: [fastify.verifyJwt],
      schema: {
        tags: ['auth'],
        summary: 'Logout user - blacklists access token and removes refresh token',
        headers: {
          type: 'object',
          properties: {
            authorization: {
              type: 'string',
              description: 'Bearer <token>',
            },
          },
        },
        response: {
          204: { type: 'null' },
        },
      },
    },
    authController.logout
  );
}
