import deviceRepo from '#repositories/device.repository';

export const getDevices = async (room) => {
  let devices = await deviceRepo.findAll();
  if (room) {
    devices = devices.filter(
      (d) => d.room.toLowerCase() === room.toLowerCase()
    );
  }
  return devices;
};

export const addDevice = async (data) => {
  return deviceRepo.create(data);
};

export const updateDevice = async (id, data) => {
  return deviceRepo.update(id, data);
};

export const deleteDevice = async (id) => {
  return deviceRepo.remove(id);
};

export default {
  getDevices,
  addDevice,
  updateDevice,
  deleteDevice,
};
