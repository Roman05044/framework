/* eslint-disable no-process-env */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');

const migrate = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      multipleStatements: true,
    });

    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    const currentHash = crypto
      .createHash('md5')
      .update(schemaSql)
      .digest('hex');

    // Make sure migrations table exists to check hash
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash VARCHAR(32) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const [rows] = await connection.execute(
      'SELECT hash FROM migrations ORDER BY id DESC LIMIT 1'
    );

    let savedHash = '';
    if (rows && rows.length > 0) {
      savedHash = rows[0].hash;
    }

    if (savedHash === currentHash) {
      console.log('Migration not required. Hashes match.');
      return;
    }

    console.log('Data schema changed or initializing. Executing schema.sql...');

    await connection.query(schemaSql);

    await connection.execute('INSERT INTO migrations (hash) VALUES (?)', [
      currentHash,
    ]);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

migrate();
