const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

module.exports = async function globalTeardown() {
  dotenv.config({ path: path.join(process.cwd(), '.env.test') });

  const testDb = process.env.TYPEORM_DATABASE;
  const client = new Client({
    host: process.env.TYPEORM_HOST,
    port: parseInt(process.env.TYPEORM_PORT, 10),
    user: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: 'postgres',
  });

  await client.connect();
  // Terminate active connections so the DB can be dropped
  await client.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [testDb]
  );
  await client.query(`DROP DATABASE IF EXISTS "${testDb}"`);
  console.log(`Dropped test database: ${testDb}`);
  await client.end();
};
