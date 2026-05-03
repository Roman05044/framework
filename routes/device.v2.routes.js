import deviceController from '#controllers/device.controller';
import { paginationQuerySchema } from '#schemas/pagination.schema';

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
