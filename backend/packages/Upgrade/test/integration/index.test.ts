import { Connection } from 'typeorm';
import { configureLogger } from '../utils/logger';
import { createDatabaseConnection, closeDatabase, migrateDatabase } from '../utils/database';
// import {
//   Scenario1,
//   Scenario2,
//   Scenario3,
//   Scenario4,
//   Scenario5,
//   Scenario6,
//   Scenario8,
//   RevertToDefault,
//   RevertToCondition,
//   // PreviewScenario1,
//   // PreviewScenario2,
//   // PreviewScenario3,
//   // PreviewScenario4,
//   // PreviewScenario5,
//   // PreviewForcedAssigned,
// } from './ExperimentAssignment';
// import { UpdateExperiment, ExperimentEndDate, ExperimentStartDate } from './Experiment/update';
// import { ExperimentContextAssignments } from './Experiment/experimentContext';
// import { NoGroup, NoWorkingGroup, IncorrectWorkingGroup, IncorrectGroup } from './Experiment/incorrectGroup';
// import {
//   EndExperiment,
//   StartExperiment,
//   UpdateExperimentState,
//   DeleteStartExperiment,
//   DeleteEndExperiment,
//   CompleteStartExperiment,
//   CompleteEndExperiment,
// } from './Experiment/scheduleJob';
// import { MainAuditLog } from './Experiment/auditLogs';
// import { NoPartitionPoint } from './Experiment/onlyExperimentPoint';
// // import { StatsGroupExperiment } from './ExperimentStats';
// import { NoExperiment } from './Experiment/markExperimentPoint';
// import {
//   NoPreviewUser,
//   PreviewAssignments,
//   PreviewExperimentWithPreviewUser,
//   DeletePreviewAssignmentWithExperimentUpdate,
// } from './PreviewExperiment/index';
// import { Scenario9, Scenario10 } from './ExperimentAssignment/index';
import Container from 'typedi';
import { AWSService } from '../../src/api/services/AWSService';
import AWSServiceMock from './mockData/AWSServiceMock';
import { CreateSystemUser } from '../../src/init/seed/systemUser';
import { createGlobalExcludeSegment } from '../../src/init/seed/globalExcludeSegment';
// import { SystemUserCreated } from './SystemUser/index';
// import {
//   DeletePreviewAssignmentOnExperimentDelete,
//   DeletePreviewAssignmentWithPreviewUserDelete,
// } from './PreviewExperiment/index';
// import { NoExperimentUserOnAssignment } from './ExperimentUser';
// import { DeleteAssignmentOnExperimentDelete } from './Experiment/delete/index';
// import { IndividualUserCount, GroupUserCount } from './Experiment/conditionalStateChange/index';
// import { StatsIndividualEnrollment, StatsGroupEnrollment } from './ExperimentStats/index';
// import { MetricCRUD } from './Experiment/metric';
// import { CreateLog, LogOperations, RepeatedMeasure } from './Experiment/dataLog';
// import { QueryCRUD } from './Experiment/query';
// import { StatsDetailIndividualExperiment, StatsDetailGroupExperiment } from './ExperimentStats/index';
import { GroupAndParticipants } from './EndingCriteria';
// import DecimalAssignmentWeight from './Experiment/createWithDecimal/DecimalAssigmentWeight';
// import {
//   ConditionOrder,
//   PartitionOrder,
//   ConditionAlias,
//   EnrollmentWithConditionAlias,
// } from './Experiment/conditionAndPartition';
// import { UserNotDefined } from './UserNotDefined';
// import {
//   SegmentCreate,
//   SegmentDelete,
//   SegmentUpdate,
//   SegmentMemberGroupEnrollment,
//   SegmentMemberUserEnrollment,
//   SubSegmentEnrollment,
// } from './Segment/index';
import { UpgradeLogger } from '../../src/lib/logger/UpgradeLogger';
// import { CompetingExperiment } from './Experiment/competingExperiment';
// import { FactorialExperimentCRUD, FactorialEnrollment, FactorialEnrollment2 } from './Experiment/factorial';

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
    jest.setTimeout(29999);
    await migrateDatabase(connection);

    // create System Users
    await CreateSystemUser();
    await createGlobalExcludeSegment(new UpgradeLogger());
  });

  // -------------------------------------------------------------------------
  // Tear down
  // -------------------------------------------------------------------------

  afterAll(() => closeDatabase(connection));

  // -------------------------------------------------------------------------
  // Test cases
  // -------------------------------------------------------------------------

  // test('Mark Experiment before experiment is created', async (done) => {
  //   await NoExperiment();
  //   done();
  // });

  // test('No Group for Experiment', async (done) => {
  //   await NoGroup();
  //   done();
  // });

  // test('No Working Group for Experiment', async (done) => {
  //   await NoWorkingGroup();
  //   done();
  // });

  // test('Working Group not having the key', async (done) => {
  //   await IncorrectWorkingGroup();
  //   done();
  // });

  // test('Group not having the key', async (done) => {
  //   await IncorrectGroup();
  //   done();
  // });

  test('Group and Participants', async (done) => {
    await GroupAndParticipants();
    done();
  });

  // test('Participants Only', async (done) => {
  //   await ParticipantsOnly();
  //   done();
  // });

  // test('Log Operations', async (done) => {
  //   await LogOperations();
  //   done();
  // });

  // test('Repeated Measure', async (done) => {
  //   await RepeatedMeasure();
  //   done();
  // });

  // test('User not defined', async (done) => {
  //   await UserNotDefined();
  //   done();
  // });

  // test('No Experiment user on assignment', async (done) => {
  //   await NoExperimentUserOnAssignment();
  //   done();
  // });

  // test('System User is created', async (done) => {
  //   await SystemUserCreated();
  //   done();
  // });

  // test('Competing Experiment', async (done) => {
  //   await CompetingExperiment();
  //   done();
  // });

  // test('Experiment Scenario 1 - Individual Assignment With Individual Consistency', async (done) => {
  //   await Scenario1();
  //   done();
  // });

  // // test('Experiment Preview Scenario 1 - Individual Assignment With Individual Consistency for Preview', async (done) => {
  // //   await PreviewScenario1();
  // //   done();
  // // });

  // test('Experiment Scenario 2 - Individual Assignment With Experiment Consistency', async (done) => {
  //   await Scenario2();
  //   done();
  // });

  // // test('Experiment Preview Scenario 2 - Individual Assignment With Experiment Consistency for Preview', async (done) => {
  // //   await PreviewScenario2();
  // //   done();
  // // });

  // test('Experiment Scenario 3 - Group Assignment With Group Consistency', async (done) => {
  //   await Scenario3();
  //   done();
  // });

  // // test('Experiment Preview Scenario 3 - Group Assignment With Group Consistency for Preview', async (done) => {
  // //   await PreviewScenario3();
  // //   done();
  // // });

  // test('Experiment Scenario 4 - Group Assignment With Individual Consistency', async (done) => {
  //   await Scenario4();
  //   done();
  // });

  // // test('Experiment Preview Scenario 4 - Group Assignment With Individual Consistency for Preview', async (done) => {
  // //   await PreviewScenario4();
  // //   done();
  // // });

  // test('Experiment Scenario 5 - Group Assignment With Experiment Consistency', async (done) => {
  //   await Scenario5();
  //   done();
  // });

  // // test('Experiment Preview Scenario 5 - Group Assignment With Experiment Consistency for Preview', async (done) => {
  // //   await PreviewScenario5();
  // //   done();
  // // });

  // test('Experiment Scenario 6 - Group Switching before assignment Group Assignment With Group Consistency', async (done) => {
  //   await Scenario6();
  //   done();
  // });

  // test('Experiment Scenario 8 - Group Switching after assignment Group Assignment With Group Consistency', async (done) => {
  //   await Scenario8();
  //   done();
  // });

  // test('Experiment Scenario 9 - Group Switching after assignment Group Assignment With Individual Consistency', async (done) => {
  //   await Scenario9();
  //   done();
  // });

  // test('Experiment Scenario 10 - Group Switching after assignment Group Assignment With Experiment Consistency', async (done) => {
  //   await Scenario10();
  //   done();
  // });

  // // test('Preview User Forced assignment', async (done) => {
  // //   await PreviewForcedAssigned();
  // //   done();
  // // });

  // test('Revert to Default', async (done) => {
  //   await RevertToDefault();
  //   done();
  // });

  // test('Revert to Condition', async (done) => {
  //   await RevertToCondition();
  //   done();
  // });

  // // testing experiment update over here
  // test('Update Experiment', async (done) => {
  //   await UpdateExperiment();
  //   done();
  // });

  // // testing experiment update over here
  // test('Experiment End Date when updated', async (done) => {
  //   await ExperimentEndDate();
  //   done();
  // });

  // // testing experiment update over here
  // test('Experiment Start Date when updated', async (done) => {
  //   await ExperimentStartDate();
  //   done();
  // });

  // // testing ScheduleJob
  // test('Create Scheduled Job in database to start experiment', async (done) => {
  //   await StartExperiment();
  //   done();
  // });

  // test('End Experiment after some timestamp', async (done) => {
  //   await EndExperiment();
  //   done();
  // });

  // test('Update Experiment state some timestamp', async (done) => {
  //   await UpdateExperimentState();
  //   done();
  // });

  // test('Complete Start Experiment', async (done) => {
  //   await CompleteStartExperiment();
  //   done();
  // });

  // test('Delete Start Experiment', async (done) => {
  //   await DeleteStartExperiment();
  //   done();
  // });

  // test('Complete End Experiment', async (done) => {
  //   await CompleteEndExperiment();
  //   done();
  // });

  // test('Delete End Experiment', async (done) => {
  //   await DeleteEndExperiment();
  //   done();
  // });

  // test('Check audit log', async (done) => {
  //   await MainAuditLog();
  //   done();
  // });

  // test('Stats for Individual Enrollment', async (done) => {
  //   await StatsIndividualEnrollment();
  //   done();
  // });

  // test('Stats for Group Enrollment', async (done) => {
  //   await StatsGroupEnrollment();
  //   done();
  // });

  // test('Stats from Individual Experiment for table', async (done) => {
  //   await StatsDetailIndividualExperiment();
  //   done();
  // });

  // test('Stats from Group Experiment with for table', async (done) => {
  //   await StatsDetailGroupExperiment();
  //   done();
  // });

  // test('No preview user', async (done) => {
  //   await NoPreviewUser();
  //   done();
  // });

  // test('Preview Assignments', async (done) => {
  //   await PreviewAssignments();
  //   done();
  // });

  // test('Preview experiment with preview user', async (done) => {
  //   await PreviewExperimentWithPreviewUser();
  //   done();
  // });

  // test('Experiment without decision point', async (done) => {
  //   await NoPartitionPoint();
  //   done();
  // });

  // test('Experiment with decimal assignment weights', async (done) => {
  //   await DecimalAssignmentWeight();
  //   done();
  // });

  // test('Delete Preview Assignment with experiment Update', async (done) => {
  //   await DeletePreviewAssignmentWithExperimentUpdate();
  //   done();
  // });

  // test('Delete Preview Assignment on experiment Delete', async (done) => {
  //   await DeletePreviewAssignmentOnExperimentDelete();
  //   done();
  // });

  // test('Delete Preview Assignment with preview user delete', async (done) => {
  //   await DeletePreviewAssignmentWithPreviewUserDelete();
  //   done();
  // });

  // test('Delete Assignments on Experiment Delete', async (done) => {
  //   await DeleteAssignmentOnExperimentDelete();
  //   done();
  // });

  // test('Individual User Count for State Change to Enrollment Complete', async (done) => {
  //   await IndividualUserCount();
  //   done();
  // });

  // test('Group User Count for State Change to Enrollment Complete', async (done) => {
  //   await GroupUserCount();
  //   done();
  // });

  // test('Metric CRUD', async (done) => {
  //   await MetricCRUD();
  //   done();
  // });

  // test('Create Log', async (done) => {
  //   await CreateLog();
  //   done();
  // });

  // test('Query CRUD operation', async (done) => {
  //   await QueryCRUD();
  //   done();
  // });

  // // test('Individual Experiment Enrollment Code', async (done) => {
  // //   await IndividualExperimentEnrollmentCode();
  // //   done();
  // // });

  // // test('Group Experiment Enrollment Code', async (done) => {
  // //   await GroupExperimentEnrollmentCode();
  // //   done();
  // // });

  // // test('Experiment Experiment Enrollment Code', async (done) => {
  // //   await ExperimentExperimentEnrollmentCode();
  // //   done();
  // // });

  // test('Experiment Context Assignment', async (done) => {
  //   await ExperimentContextAssignments();
  //   done();
  // });

  // test('Order For Condition', async (done) => {
  //   await ConditionOrder();
  //   done();
  // });

  // test('Order For Decision Point', async (done) => {
  //   await PartitionOrder();
  //   done();
  // });

  // // test('Experiment Level exclusion of user with FilterMode as IncludeAll', async (done) => {
  // //   await ExperimentExcludeUser();
  // //   done();
  // // });

  // // test('Experiment Level exclusion of group with FilterMode as IncludeAll', async (done) => {
  // //   await ExperimentExcludeGroup();
  // //   done();
  // // });

  // // test('Experiment Level inclusion of user with FilterMode as ExcludeAll', async (done) => {
  // //   await ExperimentIncludeUser();
  // //   done();
  // // });

  // // test('Experiment Level inclusion of group with FilterMode as ExcludeAll', async (done) => {
  // //   await ExperimentIncludeGroup();
  // //   done();
  // // });

  // test('Segments CRUD operations - Create', async (done) => {
  //   await SegmentCreate();
  //   done();
  // });

  // test('Segments CRUD operations - Update', async (done) => {
  //   await SegmentUpdate();
  //   done();
  // });

  // test('Segments CRUD operations - Delete', async (done) => {
  //   await SegmentDelete();
  //   done();
  // });

  // test('Enrollment of User of Segment', async (done) => {
  //   await SegmentMemberUserEnrollment();
  //   done();
  // });

  // test('Enrollment of Group of Segment', async (done) => {
  //   await SegmentMemberGroupEnrollment();
  //   done();
  // });

  // test('Enrollment of User of subSegment', async (done) => {
  //   await SubSegmentEnrollment();
  //   done();
  // });

  // test('ConditionAliases', async (done) => {
  //   await ConditionAlias();
  //   done();
  // });

  // test('Enrollment With ConditionAliases', async (done) => {
  //   await EnrollmentWithConditionAlias();
  //   done();
  // });

  // test('Factorial CRUD', async (done) => {
  //   await FactorialExperimentCRUD();
  //   done();
  // });

  // test('Factorial Enrollment with same Decision Point', async (done) => {
  //   await FactorialEnrollment();
  //   done();
  // });

  // test('Factorial Enrollment with different Decision Point', async (done) => {
  //   await FactorialEnrollment2();
  //   done();
  // });
  // // test('Monitored Point for Export', async (done) => {
  // //   await MonitoredPointForExport();
  // //   done();
  // // });
});
