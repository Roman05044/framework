let DEVICES = [{ id: 1, device: 'Smart Lamp', status: 'on', room: 'Kitchen' }];

export const findAll = async () => {
  return DEVICES;
};

export const findById = async (id) => {
  return DEVICES.find((d) => d.id === id);
};

export const create = async (data) => {
  const nextId =
    DEVICES.length > 0 ? Math.max(...DEVICES.map((d) => d.id)) + 1 : 1;
  const newDevice = { id: nextId, ...data };
  DEVICES.push(newDevice);
  return newDevice;
};

export const update = async (id, updates) => {
  const index = DEVICES.findIndex((d) => d.id === id);
  if (index === -1) return null;
  DEVICES[index] = { ...DEVICES[index], ...updates };
  return DEVICES[index];
};

export const remove = async (id) => {
  const originalLength = DEVICES.length;
  DEVICES = DEVICES.filter((d) => d.id !== id);
  return DEVICES.length < originalLength;
};

export default {
  findAll,
  findById,
  create,
  update,
  remove,
};
