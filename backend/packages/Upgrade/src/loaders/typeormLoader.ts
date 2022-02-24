import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { createConnection, getConnectionOptions, ConnectionOptions } from 'typeorm';

import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';
import { CONNECTION_NAME } from './enums';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const loadedConnectionOptions = await getConnectionOptions();
  const loadedreplicaConnectionOptions = await getConnectionOptions();
  const host_replicas = JSON.parse(env.db.host_replica);
  // connection options:
  const masterConnectionOptions = {
    name: CONNECTION_NAME.MAIN,
    type: env.db.type, // See createConnection options for valid types
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
  };

  const replicaConnectionOption = {
    name: CONNECTION_NAME.REPLICA,
    type: env.db.type, // See createConnection options for valid types
    replication: {
      master: {
        host: '',
        port: null,
        username: '',
        password: '',
        database: '',
      },
      slaves: [],
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  };
  // number of read replicas:
  const replicas = Object.keys(host_replicas).length;
  const replica_hosts = [];
  if (replicas === 0) {
    // if no read replica is defined, then we use master host for replica connection to handle export data
    /* tslint:disable:no-string-literal */
    replicaConnectionOption['replication']['master'] = {
      host: env.db.host,
      port: env.db.port,
      username: env.db.username,
      password: env.db.password,
      database: env.db.database,
    };
  } else if (replicas >= 1) {
    // if a single read replica is defined, then we use the first read replica host to handle export data
    /* tslint:disable:no-string-literal */
    replicaConnectionOption['replication']['slaves'] = [{
      host: host_replicas[0],
      port: env.db.port,
      username: env.db.username,
      password: env.db.password,
      database: env.db.database,
    }];

    for (let i = 1; i < replicas; i++) {
      replica_hosts.push({
        host: host_replicas[i],
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
      });
    }
  }
  // if more than one read replica is defined, then we use all the remaining read replica hosts
  // as extra read replica db connections to handle load on master db connection.
  if (replicas >= 2) {
    /* tslint:disable:no-string-literal */
    masterConnectionOptions['replication']['slaves'] = replica_hosts;
  }
  const connectionOptions: ConnectionOptions = Object.assign(loadedConnectionOptions, masterConnectionOptions);
  const replicaConnectionOptions: ConnectionOptions = Object.assign(loadedreplicaConnectionOptions, replicaConnectionOption);

  try {
    const connection = await createConnection(connectionOptions);
    const replicaConnection = await createConnection(replicaConnectionOptions);
    // run the migrations
    await connection.runMigrations();
    await replicaConnection.runMigrations();

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
