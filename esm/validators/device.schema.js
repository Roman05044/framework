export const deviceSchema = {
  type: 'object',
  required: ['device', 'status', 'room'],
  properties: {
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
  },
};

export const updateDeviceSchema = {
  type: 'object',
  properties: {
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
  },
};
