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
import { FeatureFlagExposure } from '../api/models/FeatureFlagExposure';
import { FeatureFlagSegmentInclusion } from '../api/models/FeatureFlagSegmentInclusion';
import { FeatureFlagSegmentExclusion } from '../api/models/FeatureFlagSegmentExclusion';
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
import { featureFlagSegmentInclusionExclusion1711566460836 } from '../database/migrations/1711566460836-featureFlagSegmentInclusionExclusion';
import { featureFlagExposure1711569269846 } from '../database/migrations/1711569269846-featureFlagExposure';
import { featureFlagContext1711569517358 } from '../database/migrations/1711569517358-featureFlagContext';
import { featureFlagStatusTags1711652015345 } from '../database/migrations/1711652015345-featureFlagStatusTags';
import { contextInMetric1712553037665 } from '../database/migrations/1712553037665-contextInMetric';
import { userDefaultRoleReader1713260614311 } from '../database/migrations/1713260614311-userDefaultRoleReader';
import { featureFlagFilterMode1714680515570 } from '../database/migrations/1714680515570-featureFlagFilterMode';
import { addingIndex1716191003726 } from '../database/migrations/1716191003726-addingIndex';
import { monitoredIndexesForExport1718377498760 } from '../database/migrations/1718377498760-monitoredIndexesForExport';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
  const exportReplicaHostNames = (env.db.export_replica ? JSON.parse(env.db.export_replica) : []) as string[];

  const replicaHostNames = (env.db.host_replica ? JSON.parse(env.db.host_replica) : []) as string[];

  const masterHost: PostgresConnectionCredentialsOptions = {
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    database: env.db.database,
  };

  // Dedicating a replica for export
  const exportReplicaHosts: PostgresConnectionCredentialsOptions[] = exportReplicaHostNames.map((hostname) => {
    return {
      host: hostname,
      port: env.db.port,
      username: env.db.username,
      password: env.db.password,
      database: env.db.database,
    };
  });

  const replicaHosts: PostgresConnectionCredentialsOptions[] = replicaHostNames.map((hostname) => {
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
      master: masterHost,
      slaves: replicaHosts,
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging as boolean | 'all' | LogLevel[],
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: [
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
      FeatureFlagExposure,
      FeatureFlagSegmentInclusion,
      FeatureFlagSegmentExclusion,
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
    ],
    migrations: [
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
      featureFlagSegmentInclusionExclusion1711566460836,
      featureFlagExposure1711569269846,
      featureFlagContext1711569517358,
      featureFlagStatusTags1711652015345,
      contextInMetric1712553037665,
      userDefaultRoleReader1713260614311,
      featureFlagFilterMode1714680515570,
      addingIndex1716191003726,
      monitoredIndexesForExport1718377498760,
    ],
    extra: { max: env.db.maxConnectionPool },
  };

  const exportReplicaDBConnectionOptions: PostgresConnectionOptions = {
    name: CONNECTION_NAME.REPLICA,
    type: env.db.type as 'postgres',
    replication: {
      master: masterHost,
      slaves: exportReplicaHosts ?? replicaHosts,
    },
    synchronize: env.db.synchronize,
    logging: env.db.logging as boolean | 'all' | LogLevel[],
    maxQueryExecutionTime: env.db.maxQueryExecutionTime,
    entities: [
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
      FeatureFlagExposure,
      FeatureFlagSegmentInclusion,
      FeatureFlagSegmentExclusion,
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
    ],
    migrations: [
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
      featureFlagSegmentInclusionExclusion1711566460836,
      featureFlagExposure1711569269846,
      featureFlagContext1711569517358,
      featureFlagStatusTags1711652015345,
      contextInMetric1712553037665,
      userDefaultRoleReader1713260614311,
      featureFlagFilterMode1714680515570,
      addingIndex1716191003726,
      monitoredIndexesForExport1718377498760,
    ],
  };

  try {
    const appDataSourceInstance = new DataSource(mainDBConnectionOptions);
    // register the data source instance in the typeorm-typeDI-extensions
    tteContainer.setDataSource(CONNECTION_NAME.MAIN, appDataSourceInstance);

    const exportDataSourceInstance = new DataSource(exportReplicaDBConnectionOptions);
    // register the data source instance in the typeorm-typeDI-extensions
    tteContainer.setDataSource(CONNECTION_NAME.REPLICA, exportDataSourceInstance);
    await Promise.all([appDataSourceInstance.initialize(), exportDataSourceInstance.initialize()]);

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
