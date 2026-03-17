import deviceService from '#services/device.service';

export const getAll = async (request) => {
  const { room } = request.query;
  const items = await deviceService.getDevices(room);
  return { count: items.length, items };
};

export const create = async (request, reply) => {
  const item = await deviceService.addDevice(request.body);
  reply.code(201);
  return { message: 'Пристрій додано', item };
};

export const update = async (request, reply) => {
  const id = parseInt(request.params.id);
  const item = await deviceService.updateDevice(id, request.body);
  if (!item) return reply.code(404).send({ error: 'Не знайдено' });
  return { message: 'Оновлено', item };
};

export const remove = async (request, reply) => {
  const id = parseInt(request.params.id);
  const deleted = await deviceService.deleteDevice(id);
  if (!deleted) return reply.code(404).send({ error: 'Не знайдено' });
  return { message: 'Видалено' };
};

export default {
  getAll,
  create,
  update,
  remove,
};
