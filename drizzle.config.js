/* eslint-disable no-process-env */
import 'dotenv/config';

/** @type { import("drizzle-kit").Config } */
export default {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    ...(process.env.MYSQL_PASSWORD ? { password: process.env.MYSQL_PASSWORD } : {}),
    database: process.env.MYSQL_DB,

  },
};
