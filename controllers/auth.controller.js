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
        request.session.userId = user.id;
        return { success: true, user };
      } catch (error) {
        if (error.message === 'Invalid email or password') {
          throw reply.unauthorized(error.message);
        }
        throw error;
      }
    },

    async logout(request, reply) {
      if (request.session) {
        await request.session.destroy();
      }
      reply.code(204);
      return;
    },
  };
}
