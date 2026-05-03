import deviceService from '#services/device.service';
import { MESSAGES } from '#constants/messages';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { buildImageUrl } from '../utils/url.util.js';
import { getExternalDeviceType } from '../utils/fetch.util.js';

export const getAll = async (request) => {
  const { room } = request.query || {};
  const items = await deviceService.getDevices(room);

  const formattedItems = items.map((item) => ({
    ...item,
    image: buildImageUrl(request, item.image),
  }));

  return { count: formattedItems.length, items: formattedItems };
};

export const getAllV2 = async (request) => {
  const { page, limit } = request.query;

  const { data, total } = await deviceService.getPaginatedDevices(page, limit);

  const formattedData = data.map((item) => ({
    ...item,
    image: buildImageUrl(request, item.image),
  }));

  return {
    data: formattedData,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getDetails = async (request, reply) => {
  const { id } = request.params;
  const device = await deviceService.getDeviceById(id);

  if (!device) {
    throw reply.notFound(MESSAGES.DEVICE_NOT_FOUND);
  }

  const externalData = await getExternalDeviceType(device.id);

  return {
    ...device,
    image: buildImageUrl(request, device.image),
    externalData: externalData || null,
  };
};

export const exportCsv = async (request, reply) => {
  const items = await deviceService.getDevices();

  const formattedItems = items.map((item) => ({
    ...item,
    image: buildImageUrl(request, item.image),
  }));

  const csv = stringify(formattedItems, { header: true });

  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', 'attachment; filename="devices.csv"');

  return reply.send(csv);
};

export const importData = async (request, reply) => {
  const data = await request.file();
  if (!data) {
    throw reply.badRequest('Файл не завантажено');
  }

  const buffer = await data.toBuffer();
  let items = [];

  try {
    if (
      data.mimetype === 'application/json' ||
      data.filename.endsWith('.json')
    ) {
      items = JSON.parse(buffer.toString());
    } else if (data.mimetype === 'text/csv' || data.filename.endsWith('.csv')) {
      items = parse(buffer, { columns: true, skip_empty_lines: true });
    } else {
      throw reply.badRequest('Непідтримуваний формат файлу');
    }
  } catch {
    throw reply.badRequest('Помилка читання вмісту файлу');
  }

  if (!Array.isArray(items)) {
    items = [items];
  }

  let importedCount = 0;
  let rejected = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // Validation is handled by the service/repository or we can add it here if needed
    // But the user said "Validation in controllers. Why duplicate if in schemas?"
    // Fastify handles body validation for the POST /devices endpoint.
    // For bulk import, we might still want to validate.
    // However, if we follow the rule of not duplicating, we should use the schema.
    try {
      await deviceService.addDevice(item);
      importedCount++;
    } catch (error) {
      rejected.push({
        line: i + 1,
        reason: error.message,
      });
    }
  }

  return {
    message: 'Імпорт завершено',
    imported: importedCount,
    rejected,
  };
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

export const uploadImage = async (request, reply) => {
  const { id } = request.params;
  const data = await request.file();

  if (!data) {
    throw reply.badRequest('Файл не завантажено');
  }

  if (!['image/jpeg', 'image/png'].includes(data.mimetype)) {
    throw reply.badRequest('Дозволені лише формати JPEG та PNG');
  }

  const deviceExists = await deviceService.getDeviceById(id);

  if (!deviceExists) {
    throw reply.notFound(MESSAGES.DEVICE_NOT_FOUND);
  }

  const uploadDir = path.join(process.cwd(), 'uploads', String(id));
  await fs.mkdir(uploadDir, { recursive: true });

  const extension = path.extname(data.filename);
  const fileName = `image${extension}`;
  const filePath = path.join(uploadDir, fileName);

  await pipeline(data.file, createWriteStream(filePath));

  const relativePath = `/${id}/${fileName}`;
  await deviceService.updateDevice(id, { image: relativePath });

  return {
    message: 'Зображення успішно завантажено',
    url: buildImageUrl(request, relativePath),
  };
};

export default {
  getAll,
  getAllV2,
  getDetails,
  exportCsv,
  importData,
  create,
  update,
  remove,
  uploadImage,
};
