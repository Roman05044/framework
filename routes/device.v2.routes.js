import deviceController from '#controllers/device.controller';

const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
  },
};

export default async function (fastify) {
  fastify.get(
    '/devices',
    {
      schema: {
        querystring: paginationQuerySchema,
      },
    },
    deviceController.getAllV2
  );
}
