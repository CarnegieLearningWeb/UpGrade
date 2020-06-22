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
  PreviewForcedAssigned,
} from './ExperimentAssignment';
import { IndividualExclude, GroupExclude } from './ExplicitExclude/index';
import { UpdateExperiment } from './Experiment/update';
import { ExperimentContextAssignments } from './Experiment/experimentContext';
import {
  EndExperiment,
  StartExperiment,
  UpdateExperimentState,
  DeleteStartExperiment,
  DeleteEndExperiment,
  CompleteStartExperiment,
  CompleteEndExperiment,
} from './Experiment/scheduleJob';
import { MainAuditLog } from './Experiment/auditLogs';
import { NoPartitionPoint } from './Experiment/onlyExperimentPoint';
// import { StatsGroupExperiment } from './ExperimentStats';
import {
  NoPreviewUser,
  PreviewAssignments,
  PreviewExperimentWithPreviewUser,
  DeletePreviewAssignmentWithExperimentUpdate,
} from './PreviewExperiment/index';
import { Scenario9, Scenario10 } from './ExperimentAssignment/index';
import Container from 'typedi';
import { AWSService } from '../../src/api/services/AWSService';
import AWSServiceMock from './mockData/AWSServiceMock';
import { CreateSystemUser } from '../../src/init/seed/systemUser';
import { SystemUserCreated } from './SystemUser/index';
import {
  DeletePreviewAssignmentOnExperimentDelete,
  DeletePreviewAssignmentWithPreviewUserDelete,
} from './PreviewExperiment/index';
import { NoExperimentUserOnAssignment } from './ExperimentUser';
import { DeleteAssignmentOnExperimentDelete } from './Experiment/delete/index';
import { IndividualUserCount, GroupUserCount } from './Experiment/conditionalStateChange/index';
import { GetAssignments } from './Support/index';
import {
  StatsIndividualEnrollment,
  StatsGroupEnrollment,
  StatsIndividualExperimentWithDateRange,
} from './ExperimentStats/index';
import { MetricCRUD } from './Experiment/metric';
import { CreateLog } from './Experiment/dataLog';
import { LogSum } from './Experiment/dataLog/index';
import { QueryCRUD } from './Experiment/query';
import { StatsDetailIndividualExperiment, StatsDetailGroupExperiment } from './ExperimentStats/index';

describe('Integration Tests', () => {
  // -------------------------------------------------------------------------
  // Setup up
  // -------------------------------------------------------------------------

  let connection: Connection;
  beforeAll(async () => {
    configureLogger();
    connection = await createDatabaseConnection();

    // Mocking AWS Service
    Container.set(AWSService, new AWSServiceMock());
  });

  beforeEach(async () => {
    await synchronizeDatabase(connection);

    // create System Users
    await CreateSystemUser();
  });

  // -------------------------------------------------------------------------
  // Tear down
  // -------------------------------------------------------------------------

  afterAll(() => closeDatabase(connection));

  // -------------------------------------------------------------------------
  // Test cases
  // -------------------------------------------------------------------------

  test('Log Sum', async (done) => {
    await LogSum();
    done();
  });

  test('Support Get Assignments', async (done) => {
    await GetAssignments();
    done();
  });

  test('No Experiment user on assignment', async (done) => {
    await NoExperimentUserOnAssignment();
    done();
  });

  test('System User is created', async (done) => {
    await SystemUserCreated();
    done();
  });

  test('Experiment Scenario 1 - Individual Assignment With Individual Consistency', async (done) => {
    await Scenario1();
    done();
  });

  test('Experiment Preview Scenario 1 - Individual Assignment With Individual Consistency for Preview', async (done) => {
    await PreviewScenario1();
    done();
  });

  test('Experiment Scenario 2 - Individual Assignment With Experiment Consistency', async (done) => {
    await Scenario2();
    done();
  });

  test('Experiment Preview Scenario 2 - Individual Assignment With Experiment Consistency for Preview', async (done) => {
    await PreviewScenario2();
    done();
  });

  test('Experiment Scenario 3 - Group Assignment With Group Consistency', async (done) => {
    await Scenario3();
    done();
  });

  test('Experiment Preview Scenario 3 - Group Assignment With Group Consistency for Preview', async (done) => {
    await PreviewScenario3();
    done();
  });

  test('Experiment Scenario 4 - Group Assignment With Individual Consistency', async (done) => {
    await Scenario4();
    done();
  });

  test('Experiment Preview Scenario 4 - Group Assignment With Individual Consistency for Preview', async (done) => {
    await PreviewScenario4();
    done();
  });

  test('Experiment Scenario 5 - Group Assignment With Experiment Consistency', async (done) => {
    await Scenario5();
    done();
  });

  test('Experiment Preview Scenario 5 - Group Assignment With Experiment Consistency for Preview', async (done) => {
    await PreviewScenario5();
    done();
  });

  test('Experiment Scenario 6 - Group Switching before assignment Group Assignment With Group Consistency', async (done) => {
    await Scenario6();
    done();
  });

  test('Experiment Scenario 8 - Group Switching after assignment Group Assignment With Group Consistency', async (done) => {
    await Scenario8();
    done();
  });

  test('Experiment Scenario 9 - Group Switching after assignment Group Assignment With Individual Consistency', async (done) => {
    await Scenario9();
    done();
  });

  test('Experiment Scenario 10 - Group Switching after assignment Group Assignment With Experiment Consistency', async (done) => {
    await Scenario10();
    done();
  });

  test('Preview User Forced assignment', async (done) => {
    await PreviewForcedAssigned();
    done();
  });

  test('Revert to Default', async (done) => {
    await RevertToDefault();
    done();
  });
  test('Revert to Condition', async (done) => {
    await RevertToCondition();
    done();
  });

  // testing exclusion over here
  test('Individual Exclude', async (done) => {
    await IndividualExclude();
    done();
  });

  test('Group Exclude', async (done) => {
    await GroupExclude();
    done();
  });

  // testing experiment update over here
  test('Update Experiment', async (done) => {
    await UpdateExperiment();
    done();
  });

  // testing ScheduleJob
  test('Create Scheduled Job in database to start experiment', async (done) => {
    await StartExperiment();
    done();
  });

  test('End Experiment after some timestamp', async (done) => {
    await EndExperiment();
    done();
  });

  test('Update Experiment state some timestamp', async (done) => {
    await UpdateExperimentState();
    done();
  });

  test('Complete Start Experiment', async (done) => {
    await CompleteStartExperiment();
    done();
  });

  test('Delete Start Experiment', async (done) => {
    await DeleteStartExperiment();
    done();
  });

  test('Complete End Experiment', async (done) => {
    await CompleteEndExperiment();
    done();
  });

  test('Delete End Experiment', async (done) => {
    await DeleteEndExperiment();
    done();
  });

  test('Check audit log', async (done) => {
    await MainAuditLog();
    done();
  });

  test('Stats for Individual Enrollment', async (done) => {
    await StatsIndividualEnrollment();
    done();
  });

  test('Stats for Group Enrollment', async (done) => {
    await StatsGroupEnrollment();
    done();
  });

  test('Stats from Individual Experiment with Date Range', async (done) => {
    await StatsIndividualExperimentWithDateRange();
    done();
  });

  test('Stats from Individual Experiment for table', async (done) => {
    await StatsDetailIndividualExperiment();
    done();
  });

  test('Stats from Group Experiment with for table', async (done) => {
    await StatsDetailGroupExperiment();
    done();
  });

  test('No preview user', async (done) => {
    await NoPreviewUser();
    done();
  });

  test('Preview Assignments', async (done) => {
    await PreviewAssignments();
    done();
  });

  test('Preview experiment with preview user', async (done) => {
    await PreviewExperimentWithPreviewUser();
    done();
  });

  test('Experiment without partition', async (done) => {
    await NoPartitionPoint();
    done();
  });

  test('Delete Preview Assignment with experiment Update', async (done) => {
    await DeletePreviewAssignmentWithExperimentUpdate();
    done();
  });

  test('Delete Preview Assignment on experiment Delete', async (done) => {
    await DeletePreviewAssignmentOnExperimentDelete();
    done();
  });

  test('Delete Preview Assignment with preview user delete', async (done) => {
    await DeletePreviewAssignmentWithPreviewUserDelete();
    done();
  });

  test('Delete Assignments on Experiment Delete', async (done) => {
    await DeleteAssignmentOnExperimentDelete();
    done();
  });

  test('Individual User Count for State Change to Enrollment Complete', async (done) => {
    await IndividualUserCount();
    done();
  });

  test('Group User Count for State Change to Enrollment Complete', async (done) => {
    await GroupUserCount();
    done();
  });

  test('Experiment Context Assignment', async (done) => {
    await ExperimentContextAssignments();
    done();
  });

  test('Metric CRUD', async (done) => {
    await MetricCRUD();
    done();
  });

  test('Create Log', async (done) => {
    await CreateLog();
    done();
  });

  test('Query CRUD operation', async (done) => {
    await QueryCRUD();
    done();
  });
});
