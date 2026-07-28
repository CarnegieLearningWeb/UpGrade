import { DataSource } from 'typeorm';

import { env } from '../../src/env';
import { CONNECTION_NAME } from '../../src/loaders/enums';
import { Container as tteContainer } from '../../src/typeorm-typedi-extensions';
import { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions.js';

declare type LoggerOptions =
  | boolean
  | 'all'
  | Array<'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration'>;

export const createDatabaseConnection = async (): Promise<DataSource[]> => {
  const defaultConnection: PostgresDataSourceOptions = {
    type: env.db.type as any, // See createConnection options for valid types
    database: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    logging: env.db.logging as LoggerOptions,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  };

  const exportConnection: PostgresDataSourceOptions = {
    type: env.db.type as any, // See createConnection options for valid types
    database: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    logging: env.db.logging as LoggerOptions,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
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
  return connection.runMigrations({ transaction: 'each' });
};

export const closeDatabase = (connection: DataSource) => {
  return connection && connection.destroy();
};
