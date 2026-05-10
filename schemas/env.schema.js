export const envSchema = {
  type: 'object',
  required: [
    'PORT',
    'HOSTNAME',
    'NODE_ENV',
    'ADMIN_API_KEY',
    'MYSQL_HOST',
    'MYSQL_PORT',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DB',
    'REDIS_HOST',
    'REDIS_PORT',
    'SESSION_SECRET',
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
    MYSQL_HOST: { type: 'string' },
    MYSQL_PORT: { type: 'integer', default: 3306 },
    MYSQL_USER: { type: 'string' },
    MYSQL_PASSWORD: { type: 'string' },
    MYSQL_DB: { type: 'string' },
    REDIS_HOST: { type: 'string' },
    REDIS_PORT: { type: 'integer', default: 6379 },
    SESSION_SECRET: { type: 'string', minLength: 32 },
  },
};

export default envSchema;
