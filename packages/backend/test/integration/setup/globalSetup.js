const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

module.exports = async function globalSetup() {
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
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [testDb]);
  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${testDb}"`);
    console.log(`Created test database: ${testDb}`);
  }
  await client.end();
};
