export const deviceSchema = {
  $id: 'Device',
  type: 'object',
  properties: {
    id: { type: 'string' },
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    image: { type: ['string', 'null'] },
  },
};

export const bodyCreateSchema = {
  type: 'object',
  required: ['device', 'status', 'room'],
  properties: {
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
    description: { type: 'string' },
  },
  additionalProperties: false,
};

export const bodyUpdateSchema = {
  type: 'object',
  properties: {
    device: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    room: { type: 'string', minLength: 1 },
    description: { type: 'string' },
  },
  additionalProperties: false,
};

export const paramsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
  },
};

export const querySchema = {
  type: 'object',
  properties: {
    room: { type: 'string' },
  },
};
