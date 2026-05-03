import fs from 'fs/promises';
import path from 'path';
import { writeAtomic, readJsonFile, deleteFile } from '../utils/fs.util.js';
import { DeviceModel } from '../models/device.model.js';

const dataDir = path.join(process.cwd(), 'data', 'devices');

const getNextId = async () => {
  try {
    const files = await fs.readdir(dataDir);
    const ids = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => parseInt(path.basename(f, '.json')))
      .filter((id) => !isNaN(id));
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  } catch (error) {
    if (error.code === 'ENOENT') return 1;
    throw error;
  }
};

export const findPaginated = async (page, limit) => {
  try {
    const files = await fs.readdir(dataDir);
    const jsonFiles = files
      .filter((f) => f.endsWith('.json'))
      .sort((a, b) => parseInt(a) - parseInt(b));

    const total = jsonFiles.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageFiles = jsonFiles.slice(start, end);

    const data = await Promise.all(
      pageFiles.map((file) => readJsonFile(path.join(dataDir, file)))
    );

    return {
      data: data.filter((d) => d !== null),
      total,
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { data: [], total: 0 };
    throw error;
  }
};

export const findAll = async () => {
  try {
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const devices = await Promise.all(
      jsonFiles.map((file) => readJsonFile(path.join(dataDir, file)))
    );
    return devices.filter((d) => d !== null);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

export const findById = async (id) => {
  return await readJsonFile(path.join(dataDir, `${id}.json`));
};

export const create = async (data) => {
  const nextId = await getNextId();
  const newDevice = { ...DeviceModel, ...data, id: nextId };
  await writeAtomic(path.join(dataDir, `${nextId}.json`), newDevice);
  return newDevice;
};

export const update = async (id, updates) => {
  const filePath = path.join(dataDir, `${id}.json`);
  const existing = await readJsonFile(filePath);
  if (!existing) return null;
  const updatedDevice = { ...existing, ...updates };
  await writeAtomic(filePath, updatedDevice);
  return updatedDevice;
};

export const remove = async (id) => {
  return await deleteFile(path.join(dataDir, `${id}.json`));
};

export default {
  findAll,
  findPaginated,
  findById,
  create,
  update,
  remove,
};
