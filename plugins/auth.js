import fp from 'fastify-plugin';

export default fp(async function (fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    if (!request.session || !request.session.userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});
