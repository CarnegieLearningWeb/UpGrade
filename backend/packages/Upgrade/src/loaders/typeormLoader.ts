import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { DataSource, LogLevel } from 'typeorm';

import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';
import { CONNECTION_NAME } from './enums';
import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { Container as tteContainer } from '../typeorm-typedi-extensions';

import { ArchivedStats } from '../api/models/ArchivedStats';
import { ConditionPayload } from '../api/models/ConditionPayload';
import { DecisionPoint } from '../api/models/DecisionPoint';
import { Experiment } from '../api/models/Experiment';
import { ExperimentAuditLog } from '../api/models/ExperimentAuditLog';
import { ExperimentCondition } from '../api/models/ExperimentCondition';
import { ExperimentError } from '../api/models/ExperimentError';
import { ExperimentSegmentInclusion } from '../api/models/ExperimentSegmentInclusion';
import { ExperimentSegmentExclusion } from '../api/models/ExperimentSegmentExclusion';
import { ExperimentUser } from '../api/models/ExperimentUser';
import { ExplicitIndividualAssignment } from '../api/models/ExplicitIndividualAssignment';
import { Factor } from '../api/models/Factor';
import { FeatureFlag } from '../api/models/FeatureFlag';
import { FlagVariation } from '../api/models/FlagVariation';
import { GroupEnrollment } from '../api/models/GroupEnrollment';
import { GroupExclusion } from '../api/models/GroupExclusion';
import { GroupForSegment } from '../api/models/GroupForSegment';
import { IndividualEnrollment } from '../api/models/IndividualEnrollment';
import { IndividualExclusion } from '../api/models/IndividualExclusion';
import { IndividualForSegment } from '../api/models/IndividualForSegment';
import { Level } from '../api/models/Level';
import { LevelCombinationElement } from '../api/models/LevelCombinationElement';
import { Log } from '../api/models/Log';
import { Metric } from '../api/models/Metric';
import { MonitoredDecisionPoint } from '../api/models/MonitoredDecisionPoint';
import { MonitoredDecisionPointLog } from '../api/models/MonitoredDecisionPointLog';
import { PreviewUser } from '../api/models/PreviewUser';
import { Query } from '../api/models/Query';
import { ScheduledJob } from '../api/models/ScheduledJob';
import { Segment } from '../api/models/Segment';
import { Setting } from '../api/models/Setting';
import { StateTimeLog } from '../api/models/StateTimeLogs';
import { StratificationFactor } from '../api/models/StratificationFactor';
import { User } from '../api/models/User';
import { UserStratificationFactor } from '../api/models/UserStratificationFactor';

import { baseSchema1656134880479 } from '../database/migrations/1656134880479-baseSchema';
import { userTimeZone1660214866240 } from '../database/migrations/1660214866240-userTimeZone';
import { addExcludeIfReachedInDP1661416171909 } from '../database/migrations/1661416171909-addExcludeIfReachedInDP';
import { clientExclusionCode1661429767642 } from '../database/migrations/1661429767642-clientExclusionCode';
import { ConditionAlias1661446167721 } from '../database/migrations/1661446167721-ConditionAlias';
import { multipleDecisionPointUpdates1662986488045 } from '../database/migrations/1662986488045-multipleDecisionPointUpdates';
import { addExperimentType1665047953705 } from '../database/migrations/1665047953705-addExperimentType';
import { factorialExperiment1671182276793 } from '../database/migrations/1671182276793-factorialExperiment';
import { factorRestructing1679319498815 } from '../database/migrations/1679319498815-factorRestructing';
import { replaceAliasWithPayload1679641063207 } from '../database/migrations/1679641063207-replaceAliasWithPayload';
import { payloadError1684994998819 } from '../database/migrations/1684994998819-payloadError';
import { conditionOrder1684996673747 } from '../database/migrations/1684996673747-conditionOrder';
import { uniquifier1686575888877 } from '../database/migrations/1686575888877-uniquifier';
import { remainingDevMigrations1692792001871 } from '../database/migrations/1692792001871-remainingDevMigrations';
import { archivedState1692936809279 } from '../database/migrations/1692936809279-archivedState';
import { stratificationFactorStatus1696829429134 } from '../database/migrations/1696829429134-stratificationFactorStatus';
import { stratificationFactorFeature1696498128121 } from '../database/migrations/1696498128121-stratificationFactorFeature';
import { addGroupIdForIndividualExclusion1710484793070 } from '../database/migrations/1710484793070-addGroupIdForIndividualExclusion';
import { userDefaultRoleReader1713260614311 } from '../database/migrations/1713260614311-userDefaultRoleReader';
import { revertIndividualExclusionGroupId1715937232092 } from '../database/migrations/1715937232092-revertIndividualExclusionGroupId';
import { addingIndex1716191003726 } from '../database/migrations/1716191003726-addingIndex';
import { Typeorm1719738784139 } from '../database/migrations/1719738784139-Typeorm';

const entities = [
  ArchivedStats,
  ConditionPayload,
  DecisionPoint,
  Experiment,
  ExperimentAuditLog,
  ExperimentCondition,
  ExperimentError,
  ExperimentSegmentInclusion,
  ExperimentSegmentExclusion,
  ExperimentUser,
  ExplicitIndividualAssignment,
  Factor,
  FeatureFlag,
  FlagVariation,
  GroupEnrollment,
  GroupExclusion,
  GroupForSegment,
  IndividualEnrollment,
  IndividualExclusion,
  IndividualForSegment,
  Level,
  LevelCombinationElement,
  Log,
  Metric,
  MonitoredDecisionPoint,
  MonitoredDecisionPointLog,
  PreviewUser,
  Query,
  ScheduledJob,
  Segment,
  Setting,
  StateTimeLog,
  StratificationFactor,
  User,
  UserStratificationFactor,
];

export const migrations = [
  baseSchema1656134880479,
  userTimeZone1660214866240,
  addExcludeIfReachedInDP1661416171909,
  clientExclusionCode1661429767642,
  ConditionAlias1661446167721,
  multipleDecisionPointUpdates1662986488045,
  addExperimentType1665047953705,
  factorialExperiment1671182276793,
  factorRestructing1679319498815,
  replaceAliasWithPayload1679641063207,
  payloadError1684994998819,
  conditionOrder1684996673747,
  uniquifier1686575888877,
  remainingDevMigrations1692792001871,
  archivedState1692936809279,
  stratificationFactorStatus1696829429134,
  stratificationFactorFeature1696498128121,
  addGroupIdForIndividualExclusion1710484793070,
  userDefaultRoleReader1713260614311,
  revertIndividualExclusionGroupId1715937232092,
  Typeorm1719738784139,
  addingIndex1716191003726,
];

export const migrationDataSource = new DataSource({
  name: CONNECTION_NAME.MAIN,
  type: env.db.type as 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: env.db.synchronize,
  logging: env.db.logging as boolean | 'all' | LogLevel[],
  maxQueryExecutionTime: env.db.maxQueryExecutionTime,
  entities: entities,
  migrations: migrations,
  extra: { max: env.db.maxConnectionPool },
});

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const replicaHosts = (env.db.host_replica ? JSON.parse(env.db.host_replica) : []) as string[];

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
    entities: entities,
    migrations: migrations,
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
    entities: entities,
    migrations: migrations,
  };

  try {
    const appDataSourceInstance = new DataSource(mainDBConnectionOptions);
    // register the data source instance in the typeorm-typeDI-extensions
    tteContainer.setDataSource(CONNECTION_NAME.MAIN, appDataSourceInstance);

    const exportDataSourceInstance = new DataSource(exportReplicaDBConnectionOptions);
    // register the data source instance in the typeorm-typeDI-extensions
    tteContainer.setDataSource(CONNECTION_NAME.REPLICA, exportDataSourceInstance);
    await Promise.all([appDataSourceInstance.initialize(), exportDataSourceInstance.initialize()]);

    if (!env.db.synchronize) {
      await appDataSourceInstance.runMigrations();
      await exportDataSourceInstance.runMigrations();
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
    // TODO: use logger to log the error
    const error = err as any;
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
