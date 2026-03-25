import deviceService from '#services/device.service';
import { MESSAGES } from '#constants/messages';

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
  const { id } = request.params;
  const item = await deviceService.updateDevice(id, request.body);

  if (!item) {
    throw reply.notFound(MESSAGES.DEVICE_NOT_FOUND);
  }
  return { message: 'Оновлено', item };
};

export const remove = async (request, reply) => {
  const { id } = request.params;
  const deleted = await deviceService.deleteDevice(id);

  if (!deleted) {
    throw reply.notFound(MESSAGES.DEVICE_NOT_FOUND);
  }
  return { message: 'Видалено' };
};

export default {
  getAll,
  create,
  update,
  remove,
};
