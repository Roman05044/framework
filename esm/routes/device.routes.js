import deviceController from '#controllers/device.controller';
import { deviceSchema, updateDeviceSchema } from '#validators/device.schema';

export default async function (fastify) {
  fastify.get('/devices', deviceController.getAll);

  fastify.post(
    '/devices',
    {
      schema: { body: deviceSchema },
    },
    deviceController.create
  );

  fastify.patch(
    '/devices/:id',
    {
      schema: { body: updateDeviceSchema },
    },
    deviceController.update
  );

  fastify.delete('/devices/:id', deviceController.remove);
}
