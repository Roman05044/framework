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
        summary: 'Login user',
        response: {
          200: {
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
    authController.login
  );

  fastify.post(
    '/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Logout user',
        response: {
          204: { type: 'null' },
        },
      },
    },
    authController.logout
  );
}
