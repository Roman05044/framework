export const envSchema = {
  type: 'object',
  required: [
    'PORT',
    'HOSTNAME',
    'NODE_ENV',
    'ADMIN_API_KEY',
    'MONGO_URL',
    'MONGO_DB_NAME',
  ],
  properties: {
    PORT: { type: 'integer', default: 3000 },
    HOSTNAME: { type: 'string', default: '127.0.0.1' },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production'],
      default: 'development',
    },
    ADMIN_API_KEY: { type: 'string' },
    GITHUB_TOKEN: { type: 'string' },
    MONGO_URL: { type: 'string' },
    MONGO_DB_NAME: { type: 'string' },
  },
};

export default envSchema;
