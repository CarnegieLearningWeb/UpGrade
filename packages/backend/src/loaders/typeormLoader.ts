import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { DataSource, LogLevel } from 'typeorm';
import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';
import { CONNECTION_NAME } from './enums';
import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions';
import { Container as tteContainer } from '../typeorm-typedi-extensions';
import { UpgradeLogger } from '../lib/logger/UpgradeLogger';
import type { DataSourceOptions } from 'typeorm';
import { startPerfDiagnostics } from '../lib/perfDiagnostics';

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

/**
 * Options passed straight through to the pg Pool.
 *
 * idleTimeoutMillis: pg-pool closes a pooled connection once it has sat idle this long (its own default is
 * 10s). The pool hands out its most recently released connection first, so steady traffic keeps only a few
 * connections busy; the rest — needed only during bursts — hit the timeout between bursts and have to be
 * reopened mid-burst, which the burst's requests wait on. Unset (or invalid) keeps pg-pool's default;
 * 0 means idle connections are never closed.
 *
 * min: pg-pool never closes an idle connection while the pool holds `min` or fewer, whatever
 * idleTimeoutMillis says, so a quiet stretch longer than the timeout doesn't leave the pool cold. It does
 * not open connections in advance; it only stops closing them once opened. Unset (NaN) is treated by
 * pg-pool as 0. Nothing checks it against max: at or above max, idle connections are simply never closed.
 *
 * maxLifetimeSeconds: pg-pool closes a connection this long after it was opened — immediately if idle,
 * otherwise when next released — so long-lived connections eventually reconnect and pick up DNS changes
 * (e.g. after a failover). Closed connections are not replaced until demand reopens them, and there is no
 * jitter, so connections opened together in a burst also expire together. Unset (or invalid) keeps pg-pool's
 * default of 0, meaning never. A negative value would expire every connection right away, so it is ignored.
 *
 * keepAlive / keepAliveInitialDelayMillis: TCP keepalive on each connection's socket, so a NAT gateway or
 * load balancer doesn't silently drop a connection that sits idle in the pool. The delay is how long a socket
 * sits idle before the first probe; pg's default of 0 means the OS default, which on Linux is 2 hours —
 * too late for e.g. AWS NAT's 350s idle timeout. The delay is ignored unless keepAlive is on.
 *
 * max / min unset arrive here as NaN (toNumber of an empty env var), which pg-pool replaces with its
 * defaults (10 / 0).
 */
export const buildPoolExtra = (db: {
  maxConnectionPool: number;
  minConnectionPool: number;
  idleTimeoutSeconds: number;
  maxLifetimeSeconds: number;
  keepAlive: boolean;
  keepAliveInitialDelaySeconds: number;
}) => {
  const nonNegativeOrUndefined = (value: number) => (Number.isFinite(value) && value >= 0 ? value : undefined);
  const secondsToMillis = (seconds: number) => {
    const valid = nonNegativeOrUndefined(seconds);
    return valid === undefined ? undefined : valid * 1000;
  };
  return {
    max: db.maxConnectionPool,
    min: db.minConnectionPool,
    idleTimeoutMillis: secondsToMillis(db.idleTimeoutSeconds),
    maxLifetimeSeconds: nonNegativeOrUndefined(db.maxLifetimeSeconds),
    keepAlive: db.keepAlive,
    keepAliveInitialDelayMillis: secondsToMillis(db.keepAliveInitialDelaySeconds),
  };
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
const mainDBConnectionOptions: Extract<DataSourceOptions, { type: 'postgres' }> = {
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
  extra: buildPoolExtra(env.db),
};

const exportReplicaDBConnectionOptions: Extract<DataSourceOptions, { type: 'postgres' }> = {
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

    if (env.perfDiagnostics?.enabled) {
      startPerfDiagnostics(appDataSourceInstance);
      log.info({ message: 'Perf diagnostics enabled — writing `perfdiag` lines to stdout' });
    }

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
