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

  fastify.get(
    '/devices/export',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            transform: { type: 'string', enum: ['true', 'false'] },
          },
        },
      },
    },
    deviceController.exportCsv
  );

  fastify.get('/devices/stream', deviceController.streamNdjson);

  fastify.get(
    '/devices/:id/details',
    {
      schema: {
        params: paramsSchema,
      },
    },
    deviceController.getDetails
  );

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

  fastify.get(
    '/backups/:timestamp',
    {
      schema: {
        params: {
          type: 'object',
          required: ['timestamp'],
          properties: {
            timestamp: { type: 'string' },
          },
        },
      },
    },
    deviceController.getBackup
  );
}
