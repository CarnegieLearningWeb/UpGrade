import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

import { env } from '../../src/env';
import { CONNECTION_NAME } from '../../src/loaders/enums';
import { Container as tteContainer } from '../../src/typeorm-typedi-extensions';
import { migrations } from '../../src/loaders/typeormLoader';

declare type LoggerOptions =
  | boolean
  | 'all'
  | Array<'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration'>;

export const createDatabaseConnection = async (): Promise<DataSource[]> => {
  const defaultConnection: PostgresConnectionOptions = {
    name: CONNECTION_NAME.MAIN,
    type: env.db.type as any, // See createConnection options for valid types
    database: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    logging: env.db.logging as LoggerOptions,
    entities: env.app.dirs.entities,
    migrations: migrations,
  };

  const exportConnection: PostgresConnectionOptions = {
    name: CONNECTION_NAME.REPLICA,
    type: env.db.type as any, // See createConnection options for valid types
    database: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    logging: env.db.logging as LoggerOptions,
    entities: env.app.dirs.entities,
    migrations: migrations,
  };

  const defaultAppDataSourceInstance = new DataSource(defaultConnection);
  tteContainer.setDataSource(CONNECTION_NAME.MAIN, defaultAppDataSourceInstance);

  const exportAppDataSourceInstance = new DataSource(exportConnection);
  tteContainer.setDataSource(CONNECTION_NAME.REPLICA, exportAppDataSourceInstance);
  await defaultAppDataSourceInstance.initialize();
  await exportAppDataSourceInstance.initialize();
  return [defaultAppDataSourceInstance, exportAppDataSourceInstance];
};

export const synchronizeDatabase = async (connection: DataSource) => {
  await connection.dropDatabase();
  return connection.synchronize(true);
};

export const migrateDatabase = async (connection: DataSource) => {
  await connection.dropDatabase();
  return connection.runMigrations();
};

export const closeDatabase = (connection: DataSource) => {
  return connection && connection.destroy();
};
