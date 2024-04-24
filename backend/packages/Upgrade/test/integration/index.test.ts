import { Connection } from 'typeorm';
import { configureLogger } from '../utils/logger';
import { createDatabaseConnection, closeDatabase, migrateDatabase } from '../utils/database';
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
  // PreviewScenario1,
  // PreviewScenario2,
  // PreviewScenario3,
  // PreviewScenario4,
  // PreviewScenario5,
  // PreviewForcedAssigned,
} from './ExperimentAssignment';
import { UpdateExperiment, ExperimentEndDate, ExperimentStartDate } from './Experiment/update';
import { ExperimentContextAssignments } from './Experiment/experimentContext';
import { NoGroup, NoWorkingGroup, IncorrectWorkingGroup, IncorrectGroup } from './Experiment/incorrectGroup';
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
import { NoExperiment } from './Experiment/markExperimentPoint';
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
import { createGlobalExcludeSegment } from '../../src/init/seed/globalExcludeSegment';
import { SystemUserCreated } from './SystemUser/index';
import {
  DeletePreviewAssignmentOnExperimentDelete,
  DeletePreviewAssignmentWithPreviewUserDelete,
} from './PreviewExperiment/index';
import { GroupConsistency, IndividualConsistency, NoExperimentUserOnAssignment } from './ExperimentUser';
import { DeleteAssignmentOnExperimentDelete } from './Experiment/delete/index';
import { IndividualUserCount, GroupUserCount } from './Experiment/conditionalStateChange/index';
import { StatsIndividualEnrollment, StatsGroupEnrollment, StatsWithinSubjectEnrollment } from './ExperimentStats/index';
import { MetricCRUD } from './Experiment/metric';
import { CreateLog, LogOperations, RepeatedMeasure } from './Experiment/dataLog';
import { QueryCRUD } from './Experiment/query';
import { StatsDetailIndividualExperiment, StatsDetailGroupExperiment } from './ExperimentStats/index';
import { GroupAndParticipants, ParticipantsOnly } from './EndingCriteria';
import DecimalAssignmentWeight from './Experiment/createWithDecimal/DecimalAssigmentWeight';
import {
  ConditionOrder,
  PartitionOrder,
  ConditionPayload,
  EnrollmentWithConditionPayload,
} from './Experiment/conditionAndPartition';
import { UserNotDefined } from './UserNotDefined';
import {
  SegmentCreate,
  SegmentDelete,
  SegmentUpdate,
  SegmentMemberGroupEnrollment,
  SegmentMemberUserEnrollment,
  SubSegmentEnrollment,
} from './Segment/index';
import { UpgradeLogger } from '../../src/lib/logger/UpgradeLogger';
import { CompetingExperiment } from './Experiment/competingExperiment';
import { FactorialExperimentCRUD, FactorialEnrollment, FactorialEnrollment2 } from './Experiment/factorial';
import {
  AlgorithmCheck,
  MetricQueriesCheck,
  OrderedRoundRobinAlgoCheck,
  RandomAlgoCheck,
  RandomRoundRobinAlgoCheck,
} from './Experiment/withinSubject/index';
import { CacheService } from '../../src/api/services/CacheService';
import {
  StratificationSRSAlgorithmCheck,
  StratificationMetricQueriesCheck,
  StratificationRandomAlgorithmCheck,
} from './Experiment/stratification/index';
import { IndividualExperimentEnrollmentCode, GroupExperimentEnrollmentCode, ExperimentExperimentEnrollmentCode } from './Experiment/enrollmentCode';
import { IndividualExperimentExclusionCode, GroupExperimentExclusionCode, ExperimentLevelExclusionCodeParticipant, ExperimentLevelExclusionCodeGroup, WithinSubjectExclusionCode }  from './Experiment/exclusionCode';

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
    await migrateDatabase(connection);
    const cacheManager = Container.get(CacheService);
    await cacheManager.resetAllCache();

    // create System Users
    await CreateSystemUser();
    await createGlobalExcludeSegment(new UpgradeLogger());
  }, 99999);

  // -------------------------------------------------------------------------
  // Tear down
  // -------------------------------------------------------------------------

  afterAll(() => closeDatabase(connection));

  // -------------------------------------------------------------------------
  // Test cases
  // -------------------------------------------------------------------------

  test('Mark Experiment before experiment is created', () => {
    return NoExperiment();
  });

  test('No Group for Experiment', () => {
    return NoGroup();
  });

  test('No Working Group for Experiment', () => {
    return NoWorkingGroup();
  });

  test('Working Group not having the key', () => {
    return IncorrectWorkingGroup();
  });

  test('Group not having the key', () => {
    return IncorrectGroup();
  });

  test('Group and Participants', () => {
    return GroupAndParticipants();
  });

  test('Participants Only', () => {
    return ParticipantsOnly();
  });

  test('Log Operations', () => {
    return LogOperations();
  });

  test('Repeated Measure', () => {
    return RepeatedMeasure();
  });

  test('User not defined', () => {
    return UserNotDefined();
  });

  test('No Experiment user on assignment', () => {
    return NoExperimentUserOnAssignment();
  });

  test('System User is created', () => {
    return SystemUserCreated();
  });

  test('Competing Experiment', () => {
    return CompetingExperiment();
  });

  test('Experiment Scenario 1 - Individual Assignment With Individual Consistency', () => {
    return Scenario1();
  });

  test('Experiment Scenario 2 - Individual Assignment With Experiment Consistency', () => {
    return Scenario2();
  });

  test('Experiment Scenario 3 - Group Assignment With Group Consistency', () => {
    return Scenario3();
  });

  test('Experiment Scenario 4 - Group Assignment With Individual Consistency', () => {
    return Scenario4();
  });

  test('Experiment Scenario 5 - Group Assignment With Experiment Consistency', () => {
    return Scenario5();
  });

  test('Experiment Scenario 6 - Group Switching before assignment Group Assignment With Group Consistency', () => {
    return Scenario6();
  });

  test('Experiment Scenario 8 - Group Switching after assignment Group Assignment With Group Consistency', () => {
    return Scenario8();
  });

  test('Experiment Scenario 9 - Group Switching after assignment Group Assignment With Individual Consistency', () => {
    return Scenario9();
  });

  test('Experiment Scenario 10 - Group Switching after assignment Group Assignment With Experiment Consistency', () => {
    return Scenario10();
  });

  test('Revert to Default', () => {
    return RevertToDefault();
  });

  test('Revert to Condition', () => {
    return RevertToCondition();
  });

  // testing experiment update over here
  test('Update Experiment', () => {
    return UpdateExperiment();
  });

  // testing experiment update over here
  test('Experiment End Date when updated', () => {
    return ExperimentEndDate();
  });

  // testing experiment update over here
  test('Experiment Start Date when updated', () => {
    return ExperimentStartDate();
  });

  // testing ScheduleJob
  test('Create Scheduled Job in database to start experiment', () => {
    return StartExperiment();
  });

  test('End Experiment after some timestamp', () => {
    return EndExperiment();
  });

  test('Update Experiment state some timestamp', () => {
    return UpdateExperimentState();
  });

  test('Complete Start Experiment', () => {
    return CompleteStartExperiment();
  });

  test('Delete Start Experiment', () => {
    return DeleteStartExperiment();
  });

  test('Complete End Experiment', () => {
    return CompleteEndExperiment();
  });

  test('Delete End Experiment', () => {
    return DeleteEndExperiment();
  });

  test('Check audit log', () => {
    return MainAuditLog();
  });

  test('Stats for Individual Enrollment', () => {
    return StatsIndividualEnrollment();
  });

  test('Stats for Group Enrollment', () => {
    return StatsGroupEnrollment();
  });

  test('Stats for Within-Subject Enrollment', () => {
    return StatsWithinSubjectEnrollment();
  });

  test('Stats from Individual Experiment for table', () => {
    return StatsDetailIndividualExperiment();
  });

  test('Stats from Group Experiment with for table', () => {
    return StatsDetailGroupExperiment();
  });

  test('No preview user', () => {
    return NoPreviewUser();
  });

  test('Preview Assignments', () => {
    return PreviewAssignments();
  });

  test('Preview experiment with preview user', () => {
    return PreviewExperimentWithPreviewUser();
  });

  test('Experiment without decision point', () => {
    return NoPartitionPoint();
  });

  test('Experiment with decimal assignment weights', () => {
    return DecimalAssignmentWeight();
  });

  test('Delete Preview Assignment with experiment Update', () => {
    return DeletePreviewAssignmentWithExperimentUpdate();
  });

  test('Delete Preview Assignment on experiment Delete', () => {
    return DeletePreviewAssignmentOnExperimentDelete();
  });

  test('Delete Preview Assignment with preview user delete', () => {
    return DeletePreviewAssignmentWithPreviewUserDelete();
  });

  test('Delete Assignments on Experiment Delete', () => {
    return DeleteAssignmentOnExperimentDelete();
  });

  test('Individual User Count for State Change to Enrollment Complete', () => {
    return IndividualUserCount();
  });

  test('Group User Count for State Change to Enrollment Complete', () => {
    return GroupUserCount();
  });

  test('Metric CRUD', () => {
    return MetricCRUD();
  });

  test('Create Log', () => {
    return CreateLog();
  });

  test('Query CRUD operation', () => {
    return QueryCRUD();
  });

  test('Individual Experiment Enrollment Code', () => {
    return IndividualExperimentEnrollmentCode();
  });

  test('Group Experiment Enrollment Code', () => {
    return GroupExperimentEnrollmentCode();
  });

  test('Experiment Experiment Enrollment Code', () => {
    return ExperimentExperimentEnrollmentCode();
  });

  test('Individual Experiment Exclusion Code', () => {
    return IndividualExperimentExclusionCode();
  });

  test('Experiment Experiment Exclusion Code Participant on Exclusion', () => {
    return ExperimentLevelExclusionCodeParticipant();
  });

  test('Experiment Experiment Exclusion Code Group on Exclusion', () => {
    return ExperimentLevelExclusionCodeGroup();
  });

  test('Group Experiment Exclusion Code', () => {
    return GroupExperimentExclusionCode();
  });

  test('Within Subject Exclusion Code', () => {
    return WithinSubjectExclusionCode();
  });

  test('Experiment Context Assignment', () => {
    return ExperimentContextAssignments();
  });

  test('Order For Condition', () => {
    return ConditionOrder();
  });

  test('Order For Decision Point', () => {
    return PartitionOrder();
  });

  test('Segments CRUD operations - Create', () => {
    return SegmentCreate();
  });

  test('Segments CRUD operations - Update', () => {
    return SegmentUpdate();
  });

  test('Segments CRUD operations - Delete', () => {
    return SegmentDelete();
  });

  test('Enrollment of User of Segment', () => {
    return SegmentMemberUserEnrollment();
  });

  test('Enrollment of Group of Segment', () => {
    return SegmentMemberGroupEnrollment();
  });

  test('Enrollment of User of subSegment', () => {
    return SubSegmentEnrollment();
  });

  test('ConditionPayloads', () => {
    return ConditionPayload();
  });

  test('Factorial CRUD', () => {
    return FactorialExperimentCRUD();
  });

  test('Enrollment With ConditionPayloads', () => {
    return EnrollmentWithConditionPayload();
  });

  test('Factorial Enrollment with same Decision Point', () => {
    return FactorialEnrollment();
  });

  test('Factorial Enrollment with different Decision Point', () => {
    return FactorialEnrollment2();
  });

  test('Within Subject algorithmCRUD', () => {
    return AlgorithmCheck();
  });

  test('Within Subject Random Algorithm', () => {
    return RandomAlgoCheck();
  });

  test('Within Subject Random Round Round Algorithm', () => {
    return RandomRoundRobinAlgoCheck();
  });

  test('Within Subject Ordered Round Round algorithmCRUD', () => {
    return OrderedRoundRobinAlgoCheck();
  });

  test('Within Subject metrics query check', () => {
    return MetricQueriesCheck();
  });

  test('Stratification SRS algorithm check', () => {
    return StratificationSRSAlgorithmCheck();
  });

  test('Stratification Random Algorithm', async () => {
    return StratificationRandomAlgorithmCheck();
  });

  test('Stratification metrics query check', () => {
    return StratificationMetricQueriesCheck();
  });

  test('Working group change after user exclusion for individual consistency', () => {
    return IndividualConsistency();
  });

  test('Working group change after user exclusion for group consistency', () => {
    return GroupConsistency();
  });

  // test('Experiment Preview Scenario 1 - Individual Assignment With Individual Consistency for Preview', () => {
  //   return PreviewScenario1();
  // });

  // test('Experiment Preview Scenario 2 - Individual Assignment With Experiment Consistency for Preview', () => {
  //   return PreviewScenario2();
  // });

  // test('Experiment Preview Scenario 3 - Group Assignment With Group Consistency for Preview', () => {
  //   return PreviewScenario3();
  // });

  // test('Experiment Preview Scenario 4 - Group Assignment With Individual Consistency for Preview', () => {
  //   return PreviewScenario4();
  // });

  // test('Experiment Preview Scenario 5 - Group Assignment With Experiment Consistency for Preview', () => {
  //   return PreviewScenario5();
  // });

  // test('Preview User Forced assignment', () => {
  //   return PreviewForcedAssigned();
  // });

  // test('Monitored Point for Export', () => {
  //   return MonitoredPointForExport();
  // });

  // test('Experiment Level exclusion of user with FilterMode as IncludeAll', () => {
  //   return ExperimentExcludeUser();
  // });

  // test('Experiment Level exclusion of group with FilterMode as IncludeAll', () => {
  //   return ExperimentExcludeGroup();
  // });

  // test('Experiment Level inclusion of user with FilterMode as ExcludeAll', () => {
  //   return ExperimentIncludeUser();
  // });

  // test('Experiment Level inclusion of group with FilterMode as ExcludeAll', () => {
  //   return ExperimentIncludeGroup();
  // });
});
