import deviceService from '#services/device.service';
import { MESSAGES } from '#constants/messages';
import { stringify } from 'csv-stringify';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform, Readable } from 'stream';
import { buildImageUrl } from '../utils/url.util.js';
import { getExternalDeviceType } from '../utils/fetch.util.js';
import { DeviceActiveTransform } from '../src/transforms/device.transform.js';
import { deviceEventBus } from '../utils/event-bus.util.js';

const dataDir = path.join(process.cwd(), 'data', 'devices');

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
  const { transform } = request.query || {};

  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', 'attachment; filename="devices.csv"');

  const files = await fs.readdir(dataDir);
  const jsonFiles = files
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const fileReader = Readable.from(readFilesAsObjects(jsonFiles));

  const csvStringifier = stringify({ header: true });

  if (transform === 'true') {
    const activeTransform = new DeviceActiveTransform();
    const resultStream = fileReader.pipe(activeTransform).pipe(csvStringifier);
    return reply.send(resultStream);
  }

  const resultStream = fileReader.pipe(csvStringifier);
  return reply.send(resultStream);
};

async function* readFilesAsObjects(jsonFiles) {
  for (const file of jsonFiles) {
    const filePath = path.join(dataDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    yield JSON.parse(content);
  }
}

export const streamNdjson = async (request, reply) => {
  reply.type('application/x-ndjson');

  const files = await fs.readdir(dataDir);
  const jsonFiles = files
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const fileReader = Readable.from(readFilesAsObjects(jsonFiles));

  const toNdjson = new Transform({
    objectMode: true,
    transform(obj, encoding, callback) {
      callback(null, JSON.stringify(obj) + '\n');
    },
  });

  const resultStream = fileReader.pipe(toNdjson);
  return reply.send(resultStream);
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
  deviceEventBus.emit('device:created', item);
  reply.code(201);
  return { message: 'Пристрій додано', item };
};

export const update = async (request, reply) => {
  const { id } = request.params;
  const item = await deviceService.updateDevice(id, request.body);

  if (!item) {
    throw reply.notFound(MESSAGES.DEVICE_NOT_FOUND);
  }
  deviceEventBus.emit('device:updated', item);
  return { message: 'Оновлено', item };
};

export const remove = async (request, reply) => {
  const { id } = request.params;
  const deleted = await deviceService.deleteDevice(id);

  if (!deleted) {
    throw reply.notFound(MESSAGES.DEVICE_NOT_FOUND);
  }
  deviceEventBus.emit('device:deleted', { id });
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

export const getBackup = async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || apiKey !== request.server.config.ADMIN_API_KEY) {
    throw reply.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  const { timestamp } = request.params;
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  const backupPath = path.join(backupDir, `${timestamp}.gz`);

  try {
    await fs.access(backupPath);
  } catch {
    throw reply.notFound('Backup not found');
  }

  reply.header('Content-Type', 'application/gzip');
  reply.header('Content-Disposition', `attachment; filename="${timestamp}.gz"`);

  const fileStream = createReadStream(backupPath);
  return reply.send(fileStream);
};

export default {
  getAll,
  getAllV2,
  getDetails,
  exportCsv,
  streamNdjson,
  importData,
  create,
  update,
  remove,
  uploadImage,
  getBackup,
};
