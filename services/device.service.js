let deviceRepo;

export const setRepository = (repo) => {
  deviceRepo = repo;
};

export const getDevices = async (room) => {
  if (!deviceRepo) throw new Error('Repository not initialized');
  let devices = await deviceRepo.findAll();
  if (room) {
    devices = devices.filter(
      (d) => d.room.toLowerCase() === room.toLowerCase()
    );
  }
  return devices;
};

export const getPaginatedDevices = async (page, limit) => {
  if (!deviceRepo) throw new Error('Repository not initialized');
  return deviceRepo.findPaginated(page, limit);
};

export const getDeviceById = async (id) => {
  if (!deviceRepo) throw new Error('Repository not initialized');
  return deviceRepo.findById(id);
};

export const addDevice = async (data) => {
  if (!deviceRepo) throw new Error('Repository not initialized');
  return deviceRepo.create(data);
};

export const updateDevice = async (id, data) => {
  if (!deviceRepo) throw new Error('Repository not initialized');
  return deviceRepo.update(id, data);
};

export const deleteDevice = async (id) => {
  if (!deviceRepo) throw new Error('Repository not initialized');
  return deviceRepo.remove(id);
};

export default {
  setRepository,
  getDevices,
  getPaginatedDevices,
  getDeviceById,
  addDevice,
  updateDevice,
  deleteDevice,
};
