import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.test') });

async function setupTestDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      port: process.env.MYSQL_PORT,
    });

    console.log(`Creating database ${process.env.MYSQL_DB}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DB}\``);
    await connection.query(`USE \`${process.env.MYSQL_DB}\``);

    console.log('Creating tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device VARCHAR(255) NOT NULL,
        status ENUM('on', 'off') DEFAULT 'off',
        room VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    console.log('Test database setup complete!');
    await connection.end();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    process.exit(1);
  }
}

setupTestDb();
