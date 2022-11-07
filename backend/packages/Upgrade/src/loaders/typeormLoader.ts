import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { createConnection, getConnectionOptions, ConnectionOptions } from 'typeorm';

import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';
import { CONNECTION_NAME } from './enums';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const loadedConnectionOptions = await getConnectionOptions();
  const loadedreplicaConnectionOptions = await getConnectionOptions();
  const replica_hostnames: string[] = (env.db.host_replica && JSON.parse(env.db.host_replica)) || [];

  const master_host = {
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    database: env.db.database,
  };
  const replica_hosts = replica_hostnames.map((hostname) => {
    return {
      host: hostname,
      port: env.db.port,
      username: env.db.username,
      password: env.db.password,
      database: env.db.database,
    };
  });

  // connection options:
  const mainDBConnectionOptions = {
    name: CONNECTION_NAME.MAIN,
    type: env.db.type, // See createConnection options for valid types
    replication: {
      master: master_host,
      slaves: [],
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
    extra: { max: env.db.maxConnectionPool },
  };

  const exportReplicaDBConnectionOptions = {
    name: CONNECTION_NAME.REPLICA,
    type: env.db.type, // See createConnection options for valid types
    replication: {
      master: master_host,
      slaves: [],
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  };

  if (replica_hostnames.length === 0) {
    // if no read replica is defined, then we use master host for replica connection to handle export data
    exportReplicaDBConnectionOptions.replication.slaves[0] = master_host;
  } else {
    // if a single read replica is defined, then we use the first read replica host to handle export data
    const replica_host = replica_hosts.shift();
    exportReplicaDBConnectionOptions.replication.slaves[0] = replica_host; // .shift() is like .pop() but for first item

    // if more than one read replica is defined, then we use all the remaining read replica hosts
    // as extra read replica db connections to handle load on master db connection.
    mainDBConnectionOptions.replication.slaves = replica_hosts;
  }

  const mainConnectionOptions: ConnectionOptions = Object.assign(loadedConnectionOptions, mainDBConnectionOptions);
  const exportReplicaConnectionOptions: ConnectionOptions = Object.assign(
    loadedreplicaConnectionOptions,
    exportReplicaDBConnectionOptions
  );

  try {
    const connection = await createConnection(mainConnectionOptions);
    const replicaConnection = await createConnection(exportReplicaConnectionOptions);
    // run the migrations
    await connection.runMigrations();

    if (settings) {
      settings.setData('connection', connection);
      settings.setData('replicaConnection', replicaConnection);
      settings.onShutdown(() => connection.close());
      settings.onShutdown(() => replicaConnection.close());
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
