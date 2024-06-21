import { Container } from 'typedi';
import { Connection, createConnection, useContainer } from 'typeorm';

import { env } from '../../src/env';

declare type LoggerOptions =
  | boolean
  | 'all'
  | Array<'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration'>;

export const createDatabaseConnection = async (): Promise<Connection> => {
  useContainer(Container);
  const connection = await createConnection({
    name: 'default',
    type: env.db.type as any, // See createConnection options for valid types
    database: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    logging: env.db.logging as LoggerOptions,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  });
  await createConnection({
    name: 'export',
    type: env.db.type as any, // See createConnection options for valid types
    database: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    logging: env.db.logging as LoggerOptions,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  });
  return connection;
};

export const synchronizeDatabase = async (connection: Connection) => {
  await connection.dropDatabase();
  return connection.synchronize(true);
};

export const migrateDatabase = async (connection: Connection) => {
  await connection.dropDatabase();
  return connection.runMigrations();
};

export const closeDatabase = (connection: Connection) => {
  return connection.close();
};
