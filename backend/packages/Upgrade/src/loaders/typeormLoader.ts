import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { createConnection, getConnectionOptions, ConnectionOptions } from 'typeorm';

import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const loadedConnectionOptions = await getConnectionOptions();
  const loadedreplicaConnectionOptions = await getConnectionOptions();
  const host_replicas = JSON.parse(env.db.host_replica);
  const commonConnectionOptions = {
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
      replicas: [],
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: env.app.dirs.entities,
    migrations: env.app.dirs.migrations,
  };
  // connection options:
  let masterConnectionOptions = [];
  let replicaConnectionOption = [];
  const replicas = Object.keys(host_replicas).length;

  if (replicas === 0) {
    /* tslint:disable:no-string-literal */
    masterConnectionOptions = commonConnectionOptions['replication']['replicas'] = [];
    /* tslint:disable:no-string-literal */
    replicaConnectionOption = commonConnectionOptions['replication']['replicas'] = [];
  } else {
    if (replicas === 1) {
      /* tslint:disable:no-string-literal */
      masterConnectionOptions = commonConnectionOptions['replication']['replicas'] = [];
    } else {
      const replica_hosts = [];
      for (let i = 1; i < replicas; i++) {
        replica_hosts.push({
          host: host_replicas[i],
          port: env.db.port,
          username: env.db.username,
          password: env.db.password,
          database: env.db.database,
        });
      }
      /* tslint:disable:no-string-literal */
      masterConnectionOptions = commonConnectionOptions['replication']['replicas'] = replica_hosts;
    }
    /* tslint:disable:no-string-literal */
    replicaConnectionOption = commonConnectionOptions['replication']['replicas'] = [{
      host: host_replicas[0],
      port: env.db.port,
      username: env.db.username,
      password: env.db.password,
      database: env.db.database,
    }];
  }

  replicaConnectionOption['name'] = 'export';
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
