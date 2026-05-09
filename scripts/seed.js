/* eslint-disable no-process-env */
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema.js';
import { count } from 'drizzle-orm';
import 'dotenv/config';

const INITIAL_DEVICES = [
  {
    device: 'Smart Lamp',
    status: 'on',
    room: 'Kitchen',
    description: 'RGB lamp over the table',
  },
  {
    device: 'Air Conditioner',
    status: 'off',
    room: 'Living Room',
    description: 'Main AC unit',
  },
];

const isForce = process.argv.includes('--force');

const seedData = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });
    console.log('Connected to MySQL via mysql2');

    const db = drizzle(connection, { schema, mode: 'default' });

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.devices);

    if (Number(total) > 0 && !isForce) {
      console.log('Database is not empty. Use --force to overwrite.');
      process.exit(0);
    }

    if (isForce) {
      await connection.execute('TRUNCATE TABLE devices');
      console.log('Cleared existing devices.');
    }

    await db.insert(schema.devices).values(INITIAL_DEVICES);
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

seedData();
