export const deviceSchema = {
  $id: 'Device',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
  },
};

export const bodyCreateSchema = {
  type: 'object',
  required: ['device', 'status', 'room'],
  properties: {
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

export const bodyUpdateSchema = {
  type: 'object',
  properties: {
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

export const paramsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer' },
  },
};

export const querySchema = {
  type: 'object',
  properties: {
    room: { type: 'string' },
  },
};
