import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { createConnection, getConnectionOptions, ConnectionOptions } from 'typeorm';

import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const loadedConnectionOptions = await getConnectionOptions();
  const loadedSlaveConnectionOptions = await getConnectionOptions();
  const connectionOptions: ConnectionOptions = Object.assign(loadedConnectionOptions, {
    name: 'default',
    type: env.db.type, // See createConnection options for valid types
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
    replication: {
      master: {
        host: env.db.host,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
      },
      slaves: [],
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  });
  const slaveConnectionOptions: ConnectionOptions = Object.assign(loadedSlaveConnectionOptions, {
    name: 'export',
    type: env.db.type, // See createConnection options for valid types
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
    replication: {
      master: {
        host: env.db.host,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
      },
      slaves: [{
        host: env.db.host_slave,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
      }],
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  });

  try {
    const connection = await createConnection(connectionOptions);
    const slaveConnection = await createConnection(slaveConnectionOptions);
    // run the migrations
    await connection.runMigrations();
    await slaveConnection.runMigrations();

    if (settings) {
      settings.setData('connection', connection);
      settings.setData('slaveConnection', slaveConnection);
      settings.onShutdown(() => connection.close());
      settings.onShutdown(() => slaveConnection.close());
    }
  } catch (err) {
    const error = err as any;
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