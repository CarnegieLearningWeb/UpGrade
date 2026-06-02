import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { DataSource, LogLevel } from 'typeorm';
import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';
import { CONNECTION_NAME } from './enums';
import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { Container as tteContainer } from '../typeorm-typedi-extensions';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';

const log = new UpgradeLogger();

export const parseReplicaHosts = (hostReplica?: string | null): string[] => {
  if (!hostReplica) {
    return [];
  }

  try {
    const parsedHosts = JSON.parse(hostReplica) as unknown;
    if (Array.isArray(parsedHosts) && parsedHosts.every((host) => typeof host === 'string')) {
      return parsedHosts;
    }

    log.error({
      message: 'Invalid read replica host list format — continuing without replica hosts',
      error: new Error('host_replica must be a JSON string array'),
    });
    return [];
  } catch (error) {
    log.error({
      message: 'Invalid read replica host configuration — continuing without replica hosts',
      error,
    });
    return [];
  }
};

const replicaHosts = parseReplicaHosts(env.db.host_replica);

const masterHost: PostgresConnectionCredentialsOptions = {
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
};

const replicaHost: PostgresConnectionCredentialsOptions[] = replicaHosts.map((hostname) => {
  return {
    host: hostname,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    database: env.db.database,
  };
});

// connection options:
const mainDBConnectionOptions: PostgresConnectionOptions = {
  name: CONNECTION_NAME.MAIN,
  type: env.db.type as 'postgres',
  replication: {
    master: masterHost, // use the master connection for all DB read and write operations
    slaves: [], // no slaves required
  },
  synchronize: env.db.synchronize,
  logging: env.db.logging as boolean | 'all' | LogLevel[],
  maxQueryExecutionTime: env.db.maxQueryExecutionTime,
  entities: env.app.dirs.entities,
  migrations: env.app.dirs.migrations,
  extra: { max: env.db.maxConnectionPool },
};

const exportReplicaDBConnectionOptions: PostgresConnectionOptions = {
  name: CONNECTION_NAME.REPLICA,
  type: env.db.type as 'postgres',
  replication: {
    master: masterHost, // use the master connection for export CSV related write operations if any.
    // by default we cannot perform write operations on replica, so no need to provide the master connection here.
    slaves: replicaHost, // use the replica connection for export CSV related read operations.
    // if no replica host is present, then the master connection will be used for read operations as well.
  },
  synchronize: env.db.synchronize,
  logging: env.db.logging as boolean | 'all' | LogLevel[],
  maxQueryExecutionTime: env.db.maxQueryExecutionTime,
  entities: env.app.dirs.entities,
  migrations: env.app.dirs.migrations,
};

const appDataSourceInstance = new DataSource(mainDBConnectionOptions);
const exportDataSourceInstance = new DataSource(exportReplicaDBConnectionOptions);
// Export only the primary DataSource instance
export default appDataSourceInstance;

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  try {
    // register the data source instance in the typeorm-typeDI-extensions
    tteContainer.setDataSource(CONNECTION_NAME.MAIN, appDataSourceInstance);

    // register the data source instance in the typeorm-typeDI-extensions
    tteContainer.setDataSource(CONNECTION_NAME.REPLICA, exportDataSourceInstance);
    await appDataSourceInstance.initialize();

    // Fire-and-forget replica init so a slow/unreachable replica doesn't block app startup.
    void exportDataSourceInstance.initialize().catch((replicaErr) => {
      log.error({ message: 'Read replica connection failed — continuing without replica', error: replicaErr });
    });

    if (!env.db.synchronize && !env.isECS) {
      await appDataSourceInstance.runMigrations();
    }

    if (settings) {
      // sending the connections to the next middleware
      settings.setData('connection', appDataSourceInstance);
      // settings.setData('replicaConnection', exportDataSourceInstance);
      settings.onShutdown(() => {
        [appDataSourceInstance.destroy()];
      });
    }
  } catch (err) {
    const error = err as any;
    log.error({ message: 'Database connection failed', error });
    if (error.code === 'ECONNREFUSED') {
      error.type = SERVER_ERROR.DB_UNREACHABLE;
      throw error;
    } else if (error.code === '42P07') {
      error.type = SERVER_ERROR.MIGRATION_ERROR;
      throw error;
    } else {
      // throw the error as it is
      throw error;
    }
  }
};
