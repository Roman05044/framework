import deviceService from '#services/device.service';
import { deviceEventBus } from '../utils/event-bus.util.js';

export default async function (fastify) {
  fastify.get('/devices/ws', { websocket: true }, (socket) => {
    fastify.log.info('WebSocket client connected');

    deviceService.getDevices().then((devices) => {
      socket.send(JSON.stringify({ event: 'initial', data: devices }));
    });

    const onCreated = (data) => {
      socket.send(JSON.stringify({ event: 'created', data }));
    };

    const onUpdated = (data) => {
      socket.send(JSON.stringify({ event: 'updated', data }));
    };

    const onDeleted = (payload) => {
      socket.send(JSON.stringify({ event: 'deleted', id: payload.id }));
    };

    deviceEventBus.on('device:created', onCreated);
    deviceEventBus.on('device:updated', onUpdated);
    deviceEventBus.on('device:deleted', onDeleted);

    socket.on('close', () => {
      fastify.log.info('WebSocket client disconnected');
      deviceEventBus.off('device:created', onCreated);
      deviceEventBus.off('device:updated', onUpdated);
      deviceEventBus.off('device:deleted', onDeleted);
    });
  });
}
