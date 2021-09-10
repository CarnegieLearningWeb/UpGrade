import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { createConnection, getConnectionOptions, ConnectionOptions } from 'typeorm';

import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const loadedConnectionOptions = await getConnectionOptions();

  const connectionOptions: ConnectionOptions = Object.assign(loadedConnectionOptions, {
    type: env.db.type, // See createConnection options for valid types
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    database: env.db.database,
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  });

  try {
    const connection = await createConnection(connectionOptions);
    // run the migrations
    await connection.runMigrations();

    if (settings) {
      settings.setData('connection', connection);
      settings.onShutdown(() => connection.close());
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      error.type = SERVER_ERROR.DB_UNREACHABLE;
      throw error;
    } else if (error.code === '42P07') {
      error.type = SERVER_ERROR.MIGRATION_ERROR;
      throw error;
    } else {
      error.type = SERVER_ERROR.DB_AUTH_FAIL;
      throw error;
    }
  }
};
