import deviceController from '#controllers/device.controller';
import {
  deviceSchema,
  bodyCreateSchema,
  bodyUpdateSchema,
  paramsSchema,
  querySchema,
} from '#schemas/device.schema';

export default async function (fastify) {
  fastify.addSchema(deviceSchema);

  fastify.get(
    '/devices',
    {
      schema: {
        querystring: querySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              items: { type: 'array', items: { $ref: 'Device#' } },
            },
          },
        },
      },
    },
    deviceController.getAll
  );

  fastify.get('/devices/export', deviceController.exportCsv);

  fastify.post('/devices/import', deviceController.importData);

  fastify.post(
    '/devices',
    {
      schema: {
        body: bodyCreateSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              item: { $ref: 'Device#' },
            },
          },
        },
      },
    },
    deviceController.create
  );

  fastify.patch(
    '/devices/:id',
    {
      schema: {
        params: paramsSchema,
        body: bodyUpdateSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              item: { $ref: 'Device#' },
            },
          },
        },
      },
    },
    deviceController.update
  );

  // ДОДАНО: Маршрут для завантаження зображення
  fastify.post(
    '/devices/:id/image',
    {
      schema: {
        params: paramsSchema,
      },
    },
    deviceController.uploadImage
  );

  fastify.delete(
    '/devices/:id',
    {
      schema: {
        params: paramsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    deviceController.remove
  );
}
