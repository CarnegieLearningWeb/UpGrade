import { Connection } from 'typeorm';
import { configureLogger } from '../utils/logger';
import { synchronizeDatabase, createDatabaseConnection, closeDatabase } from '../utils/database';
import {
  Scenario1,
  Scenario2,
  Scenario3,
  Scenario4,
  Scenario5,
  Scenario6,
  Scenario8,
  RevertToDefault,
  RevertToCondition,
  PreviewScenario1,
  PreviewScenario2,
  PreviewScenario3,
  PreviewScenario4,
  PreviewScenario5,
} from './ExperimentAssignment';
import { IndividualExclude, GroupExclude } from './ExplicitExclude/index';
import { UpdateExperiment } from './Experiment/update';
import {
  EndExperiment,
  StartExperiment,
  UpdateExperimentState,
  DeleteStartExperiment,
  DeleteEndExperiment,
} from './Experiment/scheduleJob';
import { MainAuditLog } from './Experiment/auditLogs';
import { NoPartitionPoint } from './Experiment/onlyExperimentPoint';
import { StatsGroupExperiment, StatsIndividualExperiment } from './ExperimentStats';
import { NoPreviewUser, PreviewExperimentWithPreviewUser } from './PreviewExperiment/index';
import { Scenario9, Scenario10 } from './ExperimentAssignment/index';

describe('Integration Tests', () => {
  // -------------------------------------------------------------------------
  // Setup up
  // -------------------------------------------------------------------------

  let connection: Connection;
  beforeAll(async () => {
    configureLogger();
    connection = await createDatabaseConnection();
  });

  beforeEach(async () => {
    await synchronizeDatabase(connection);
  });

  // -------------------------------------------------------------------------
  // Tear down
  // -------------------------------------------------------------------------

  afterAll(() => closeDatabase(connection));

  // -------------------------------------------------------------------------
  // Test cases
  // -------------------------------------------------------------------------
  // test('Experiment Scenario 1 - Individual Assignment With Individual Consistency', async done => {
  //   await Scenario1();
  //   done();
  // });

  // test('Experiment Preview Scenario 1 - Individual Assignment With Individual Consistency for Preview', async done => {
  //   await PreviewScenario1();
  //   done();
  // });

  // test('Experiment Scenario 2 - Individual Assignment With Experiment Consistency', async done => {
  //   await Scenario2();
  //   done();
  // });

  // test('Experiment Preview Scenario 2 - Individual Assignment With Experiment Consistency for Preview', async done => {
  //   await PreviewScenario2();
  //   done();
  // });

  // test('Experiment Scenario 3 - Group Assignment With Group Consistency', async done => {
  //   await Scenario3();
  //   done();
  // });

  // test('Experiment Preview Scenario 3 - Group Assignment With Group Consistency for Preview', async done => {
  //   await PreviewScenario3();
  //   done();
  // });

  // test('Experiment Scenario 4 - Group Assignment With Individual Consistency', async done => {
  //   await Scenario4();
  //   done();
  // });

  // test('Experiment Preview Scenario 4 - Group Assignment With Individual Consistency for Preview', async done => {
  //   await PreviewScenario4();
  //   done();
  // });

  // test('Experiment Scenario 5 - Group Assignment With Experiment Consistency', async done => {
  //   await Scenario5();
  //   done();
  // });

  // test('Experiment Preview Scenario 5 - Group Assignment With Experiment Consistency for Preview', async done => {
  //   await PreviewScenario5();
  //   done();
  // });

  // test('Experiment Scenario 6 - Group Switching before assignment Group Assignment With Group Consistency', async done => {
  //   await Scenario6();
  //   done();
  // });

  // test('Experiment Scenario 8 - Group Switching after assignment Group Assignment With Group Consistency', async done => {
  //   await Scenario8();
  //   done();
  // });

  // test('Experiment Scenario 9 - Group Switching after assignment Group Assignment With Individual Consistency', async done => {
  //   await Scenario9();
  //   done();
  // });

  // test('Experiment Scenario 10 - Group Switching after assignment Group Assignment With Experiment Consistency', async done => {
  //   await Scenario10();
  //   done();
  // });

  // test('Revert to Default', async done => {
  //   await RevertToDefault();
  //   done();
  // });
  // test('Revert to Condition', async done => {
  //   await RevertToCondition();
  //   done();
  // });

  // // testing exclusion over here
  // test('Individual Exclude', async done => {
  //   await IndividualExclude();
  //   done();
  // });

  // test('Group Exclude', async done => {
  //   await GroupExclude();
  //   done();
  // });

  // // testing experiment update over here
  // test('Update Experiment', async done => {
  //   await UpdateExperiment();
  //   done();
  // });

  // testing ScheduleJob
  test('Create Scheduled Job in database to start experiment', async done => {
    await StartExperiment();
    done();
  });

  // test('End Experiment after some timestamp', async done => {
  //   await EndExperiment();
  //   done();
  // });

  // test('Update Experiment state some timestamp', async done => {
  //   await UpdateExperimentState();
  //   done();
  // });

  // test('Delete Start Experiment', async done => {
  //   await DeleteStartExperiment();
  //   done();
  // });

  // test('Delete End Experiment', async done => {
  //   await DeleteEndExperiment();
  //   done();
  // });

  // test('Check audit log', async done => {
  //   await MainAuditLog();
  //   done();
  // });

  // test('Stats for Group Experiment', async done => {
  //   await StatsGroupExperiment();
  //   done();
  // });

  // test('Stats for Individual Experiment', async done => {
  //   await StatsIndividualExperiment();
  //   done();
  // });

  // test('No preview user', async done => {
  //   await NoPreviewUser();
  //   done();
  // });

  // test('Preview experiment with preview user', async done => {
  //   await PreviewExperimentWithPreviewUser();
  //   done();
  // });

  // test('Experiment without partition', async done => {
  //   await NoPartitionPoint();
  //   done();
  // });
});
