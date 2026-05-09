import mysql from 'mysql2/promise';
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
    // eslint-disable-next-line no-process-env
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });
    console.log('Connected to MySQL');

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM devices');
    const count = rows[0].count;

    if (count > 0 && !isForce) {
      console.log('Database is not empty. Use --force to overwrite.');
      process.exit(0);
    }

    if (isForce) {
      await connection.execute('TRUNCATE TABLE devices');
      console.log('Cleared existing devices.');
    }

    for (const item of INITIAL_DEVICES) {
      await connection.execute(
        'INSERT INTO devices (device, status, room, description) VALUES (?, ?, ?, ?)',
        [item.device, item.status, item.room, item.description]
      );
    }
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
