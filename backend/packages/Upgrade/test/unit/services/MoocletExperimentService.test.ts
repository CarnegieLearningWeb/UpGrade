import 'reflect-metadata';
import { ExperimentDTO } from '../../../../Upgrade/src/api/DTO/ExperimentDTO';
import { UserDTO } from '../../../../Upgrade/src/api/DTO/UserDTO';
import { MoocletExperimentRef } from '../../../src/api/models/MoocletExperimentRef';
import { ArchivedStatsRepository } from '../../../src/api/repositories/ArchivedStatsRepository';
import { ConditionPayloadRepository } from '../../../src/api/repositories/ConditionPayloadRepository';
import { DecisionPointRepository } from '../../../src/api/repositories/DecisionPointRepository';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { ExperimentConditionRepository } from '../../../src/api/repositories/ExperimentConditionRepository';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { ExperimentSegmentExclusionRepository } from '../../../src/api/repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../../../src/api/repositories/ExperimentSegmentInclusionRepository';
import { ExperimentUserRepository } from '../../../src/api/repositories/ExperimentUserRepository';
import { FactorRepository } from '../../../src/api/repositories/FactorRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { LevelCombinationElementRepository } from '../../../src/api/repositories/LevelCombinationElements';
import { LevelRepository } from '../../../src/api/repositories/LevelRepository';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { MonitoredDecisionPointRepository } from '../../../src/api/repositories/MonitoredDecisionPointRepository';
import { MoocletExperimentRefRepository } from '../../../src/api/repositories/MoocletExperimentRefRepository';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { StateTimeLogsRepository } from '../../../src/api/repositories/StateTimeLogsRepository';
import { StratificationFactorRepository } from '../../../src/api/repositories/StratificationFactorRepository';
import { CacheService } from '../../../src/api/services/CacheService';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { MoocletDataService } from '../../../src/api/services/MoocletDataService';
import { MoocletExperimentService, SyncCreateParams } from '../../../src/api/services/MoocletExperimentService';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { QueryService } from '../../../src/api/services/QueryService';
import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { DataSource, EntityManager } from 'typeorm';
import { ASSIGNMENT_ALGORITHM, ASSIGNMENT_UNIT, CONSISTENCY_RULE, EXPERIMENT_STATE, EXPERIMENT_TYPE, FILTER_MODE, PAYLOAD_TYPE, POST_EXPERIMENT_RULE, SEGMENT_TYPE } from 'upgrade_types';

const mockDataSource = {
  initialize: jest.fn(),
  destroy: jest.fn(),
  manager: {
    transaction: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  },
  // Add other properties that your code might use
} as unknown as DataSource;

jest.mock('typeorm', () => {
  const originalModule = jest.requireActual('typeorm');
  return {
    ...originalModule,
    DataSource: jest.fn().mockImplementation(() => mockDataSource),
  };
});

jest.mock('../../../src/api/services/MoocletDataService');
jest.mock('../../../src/api/repositories/ExperimentRepository');
jest.mock('../../../src/api/repositories/ExperimentConditionRepository');
jest.mock('../../../src/api/repositories/DecisionPointRepository');
jest.mock('../../../src/api/repositories/ExperimentAuditLogRepository');
jest.mock('../../../src/api/repositories/IndividualExclusionRepository');
jest.mock('../../../src/api/repositories/GroupExclusionRepository');
jest.mock('../../../src/api/repositories/MonitoredDecisionPointRepository');
jest.mock('../../../src/api/repositories/ExperimentUserRepository');
jest.mock('../../../src/api/repositories/MetricRepository');
jest.mock('../../../src/api/repositories/QueryRepository');
jest.mock('../../../src/api/repositories/StateTimeLogsRepository');
jest.mock('../../../src/api/repositories/ExperimentSegmentInclusionRepository');
jest.mock('../../../src/api/repositories/ExperimentSegmentExclusionRepository');
jest.mock('../../../src/api/repositories/ConditionPayloadRepository');
jest.mock('../../../src/api/repositories/FactorRepository');
jest.mock('../../../src/api/repositories/LevelRepository');
jest.mock('../../../src/api/repositories/ArchivedStatsRepository');
jest.mock('../../../src/api/repositories/StratificationFactorRepository');
jest.mock('../../../src/api/repositories/MoocletExperimentRefRepository');
jest.mock('../../../src/api/services/PreviewUserService');
jest.mock('../../../src/api/services/SegmentService');
jest.mock('../../../src/api/services/ScheduledJobService');
jest.mock('../../../src/api/services/ErrorService');
jest.mock('../../../src/api/services/CacheService');
jest.mock('../../../src/api/services/QueryService');

const moocletExperimentDataTSConfigurable = {
    name: "test",
    description: "",
    consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
    assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
    type: EXPERIMENT_TYPE.SIMPLE,
    context: ["mathstream"],
    assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
    stratificationFactor: null,
    tags: [],
    conditions: [
      {
        id: "A",
        conditionCode: "question-hint-default",
        assignmentWeight: 50,
        description: null,
        order: 1,
        name: ""
      },
      {
        id: "B",
        conditionCode: "question-hint-tutorbot",
        assignmentWeight: 50,
        description: null,
        order: 2,
        name: ""
      }
    ],
    conditionPayloads: [
      {
        id: "E",
        payload: {
          type: PAYLOAD_TYPE.STRING,
          value: "question-hint-default"
        },
        parentCondition: "A",
        decisionPoint: "C"
      },
      {
        id: "F",
        payload: {
          type: PAYLOAD_TYPE.STRING,
          value: "question-hint-tutorbot"
        },
        parentCondition: "B",
        decisionPoint: "C"
      }
    ],
    partitions: [
      {
        id: "C",
        site: "lesson-stream",
        target: "question-hint",
        description: "",
        order: 1,
        excludeIfReached: false
      }
    ],
    experimentSegmentInclusion: {
      segment: {
        individualForSegment: [],
        groupForSegment: [
          {
            type: "All",
            groupId: "All"
          }
        ],
        subSegments: [],
        type: SEGMENT_TYPE.PRIVATE
      }
    },
    experimentSegmentExclusion: {
      segment: {
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.PRIVATE
      }
    },
    filterMode: FILTER_MODE.EXCLUDE_ALL,
    queries: [],
    endOn: null,
    enrollmentCompleteCondition: null,
    startOn: null,
    state: EXPERIMENT_STATE.ENROLLING,
    postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
    revertTo: null,
    moocletPolicyParameters: {
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      prior: {
        success: 1,
        failure: 1
      },
      batch_size: 1,
      max_rating: 1,
      min_rating: 0,
      uniform_threshold: 0,
      tspostdiff_thresh: 0,
      outcome_variable_name: "TS_CONFIG_TEST"
    },
  };


describe('#MoocletExperimentService', () => {
  let moocletExperimentService: MoocletExperimentService;
  let moocletDataService: MoocletDataService;
  let experimentRepository: ExperimentRepository;
  let experimentConditionRepository: ExperimentConditionRepository;
  let decisionPointRepository: DecisionPointRepository;
  let experimentAuditLogRepository: ExperimentAuditLogRepository;
  let individualExclusionRepository: IndividualExclusionRepository;
  let groupExclusionRepository: GroupExclusionRepository;
  let monitoredDecisionPointRepository: MonitoredDecisionPointRepository;
  let experimentUserRepository: ExperimentUserRepository;
  let metricRepository: MetricRepository;
  let queryRepository: QueryRepository;
  let stateTimeLogsRepository: StateTimeLogsRepository;
  let experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository;
  let experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository;
  let conditionPayloadRepository: ConditionPayloadRepository;
  let factorRepository: FactorRepository;
  let levelRepository: LevelRepository;
  let levelCombinationElementsRepository: LevelCombinationElementRepository;
  let archivedStatsRepository: ArchivedStatsRepository;
  let stratificationRepository: StratificationFactorRepository;
  let moocletExperimentRefRepository: MoocletExperimentRefRepository;
  let previewUserService: PreviewUserService;
  let segmentService: SegmentService;
  let scheduledJobService: ScheduledJobService;
  let errorService: ErrorService;
  let cacheService: CacheService;
  let queryService: QueryService;

  beforeAll(() => {
    // Create service with mocked dependencies
    moocletExperimentService = new MoocletExperimentService(
      moocletDataService,
      experimentRepository,
      experimentConditionRepository,
      decisionPointRepository,
      experimentAuditLogRepository,
      individualExclusionRepository,
      groupExclusionRepository,
      monitoredDecisionPointRepository,
      experimentUserRepository,
      metricRepository,
      queryRepository,
      stateTimeLogsRepository,
      experimentSegmentInclusionRepository,
      experimentSegmentExclusionRepository,
      conditionPayloadRepository,
      factorRepository,
      levelRepository,
      levelCombinationElementsRepository,
      archivedStatsRepository,
      stratificationRepository,
      moocletExperimentRefRepository,
      mockDataSource,
      previewUserService,
      segmentService,
      scheduledJobService,
      errorService,
      cacheService,
      queryService
    );
  });

  describe('#handleCreateMoocletTransaction', () => {
    let manager: EntityManager;
    let params: SyncCreateParams;
    let mockExperimentResponse: ExperimentDTO;
    let mockMoocletExperimentRefResponse: MoocletExperimentRef;
  
    beforeEach(() => {
      mockExperimentResponse = {
        id: 'exp-123',
      } as ExperimentDTO;
  
      mockMoocletExperimentRefResponse = {
        id: 'moocletRef-123',
      } as MoocletExperimentRef;

      manager = mockDataSource.manager as EntityManager;
      params = {
        experimentDTO: moocletExperimentDataTSConfigurable,
        currentUser: {} as UserDTO
      };
  
      // Spy on class methods
      jest.spyOn(moocletExperimentService as any, 'createExperiment').mockResolvedValue(mockExperimentResponse);
      jest.spyOn(moocletExperimentService as any, 'orchestrateMoocletCreation').mockResolvedValue(mockMoocletExperimentRefResponse);
      jest.spyOn(moocletExperimentService as any, 'saveMoocletExperimentRef').mockResolvedValue(undefined);
      jest.spyOn(moocletExperimentService as any, 'createAndSaveVersionConditionMaps').mockResolvedValue(undefined);
      jest.spyOn(moocletExperimentService as any, 'orchestrateDeleteMoocletResources').mockResolvedValue(undefined);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should successfully create a mooclet experiment with all required resources', async () => {
      const result = await moocletExperimentService['handleCreateMoocletTransaction'](
        manager,
        params
      );
  
      // Verify all methods were called with correct parameters
      expect(moocletExperimentService['createExperiment']).toHaveBeenCalledWith(
        manager,
        params
      );
  
      expect(moocletExperimentService['orchestrateMoocletCreation']).toHaveBeenCalledWith(
        mockExperimentResponse,
        params.experimentDTO.moocletPolicyParameters
      );
  
      expect(moocletExperimentService['saveMoocletExperimentRef']).toHaveBeenCalledWith(
        manager,
        mockMoocletExperimentRefResponse
      );
  
      expect(moocletExperimentService['createAndSaveVersionConditionMaps']).toHaveBeenCalledWith(
        manager,
        mockMoocletExperimentRefResponse
      );
  
      // Verify the result
      expect(result).toEqual({
        ...mockExperimentResponse,
        moocletPolicyParameters: params.experimentDTO.moocletPolicyParameters
      });
  
      // Verify orchestrateDeleteMoocletResources was not called
      expect(moocletExperimentService['orchestrateDeleteMoocletResources']).not.toHaveBeenCalled();
    });
  
    it('should handle failure during createExperiment and throw error', async () => {
      const error = new Error('Failed to create experiment');
      jest.spyOn(moocletExperimentService as any, 'createExperiment').mockRejectedValue(error);
  
      await expect(
        moocletExperimentService['handleCreateMoocletTransaction'](manager, params)
      ).rejects.toThrow(error);
  
      // Verify subsequent methods were not called
      expect(moocletExperimentService['orchestrateMoocletCreation']).not.toHaveBeenCalled();
      expect(moocletExperimentService['saveMoocletExperimentRef']).not.toHaveBeenCalled();
      expect(moocletExperimentService['createAndSaveVersionConditionMaps']).not.toHaveBeenCalled();
    });
  
    it('should handle failure during orchestrateMoocletCreation and throw error', async () => {
      const error = new Error('Failed to create mooclet resources');
      jest.spyOn(moocletExperimentService as any, 'orchestrateMoocletCreation').mockRejectedValue(error);
  
      await expect(
        moocletExperimentService['handleCreateMoocletTransaction'](manager, params)
      ).rejects.toThrow(error);
  
      // Verify subsequent methods were not called
      expect(moocletExperimentService['saveMoocletExperimentRef']).not.toHaveBeenCalled();
      expect(moocletExperimentService['createAndSaveVersionConditionMaps']).not.toHaveBeenCalled();
    });
  
    it('should handle failure during saveMoocletExperimentRef and cleanup resources', async () => {
      const error = new Error('Failed to save mooclet ref');
      jest.spyOn(moocletExperimentService as any, 'saveMoocletExperimentRef').mockRejectedValue(error);
  
      await expect(
        moocletExperimentService['handleCreateMoocletTransaction'](manager, params)
      ).rejects.toThrow(error);
  
      // Verify cleanup was called
      expect(moocletExperimentService['orchestrateDeleteMoocletResources']).toHaveBeenCalledWith(
        mockMoocletExperimentRefResponse
      );
    });
  
    it('should handle failure during createAndSaveVersionConditionMaps and cleanup resources', async () => {
      const error = new Error('Failed to save version condition maps');
      jest.spyOn(moocletExperimentService as any, 'createAndSaveVersionConditionMaps').mockRejectedValue(error);
  
      await expect(
        moocletExperimentService['handleCreateMoocletTransaction'](manager, params)
      ).rejects.toThrow(error);
  
      // Verify cleanup was called
      expect(moocletExperimentService['orchestrateDeleteMoocletResources']).toHaveBeenCalledWith(
        mockMoocletExperimentRefResponse
      );
    });
  });

});