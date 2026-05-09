import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export const checkMigrationStatus = async (fastify) => {
  try {
    const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    const currentHash = crypto
      .createHash('md5')
      .update(schemaSql)
      .digest('hex');

    const [rows] = await fastify.mysql.execute(
      'SELECT hash FROM migrations ORDER BY id DESC LIMIT 1'
    );

    let savedHash = '';
    if (rows && rows.length > 0) {
      savedHash = rows[0].hash;
    }

    if (currentHash !== savedHash) {
      fastify.log.warn(
        'Data schema changed. Run "npm run migrate" to update database schema.'
      );
    }
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      fastify.log.warn('Database not initialized. Run "npm run migrate".');
    } else {
      fastify.log.error(err, 'Failed to check migration status');
    }
  }
};

export default checkMigrationStatus;
