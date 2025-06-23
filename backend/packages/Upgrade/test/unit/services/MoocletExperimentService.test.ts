import 'reflect-metadata';
import { ExperimentDTO } from '../../../../Upgrade/src/api/DTO/ExperimentDTO';
import { UserDTO } from '../../../../Upgrade/src/api/DTO/UserDTO';
import { MoocletExperimentRef } from '../../../src/api/models/MoocletExperimentRef';
import { ArchivedStatsRepository } from '../../../src/api/repositories/ArchivedStatsRepository';
import { ConditionPayloadRepository } from '../../../src/api/repositories/ConditionPayloadRepository';
import { DecisionPointRepository } from '../../../src/api/repositories/DecisionPointRepository';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { SegmentRepository } from '../../../src/api/repositories/SegmentRepository';
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
import {
  ASSIGNMENT_ALGORITHM,
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  EXPERIMENT_STATE,
  EXPERIMENT_TYPE,
  FILTER_MODE,
  PAYLOAD_TYPE,
  POST_EXPERIMENT_RULE,
  SEGMENT_TYPE,
} from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { MetricService } from '../../../src/api/services/MetricService';
import { MoocletRewardsService } from '../../../src/api/services/MoocletRewardsService';

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
jest.mock('../../../src/api/repositories/SegmentRepository');
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
jest.mock('../../../src/api/services/MetricService');
jest.mock('../../../src/api/services/MoocletRewardsService');

const mockTSConfigMoocletPolicyParameters = {
  assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
  prior: {
    success: 1,
    failure: 1,
  },
  batch_size: 1,
  max_rating: 1,
  min_rating: 0,
  uniform_threshold: 0,
  tspostdiff_thresh: 0,
  outcome_variable_name: 'TS_CONFIG_TEST',
};

const moocletExperimentDataTSConfigurable = {
  id: 'test-exp-123',
  name: 'test',
  description: '',
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  type: EXPERIMENT_TYPE.SIMPLE,
  context: ['mathstream'],
  assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
  stratificationFactor: null,
  tags: [],
  conditions: [
    {
      id: 'A',
      conditionCode: 'question-hint-default',
      assignmentWeight: 50,
      description: null,
      order: 1,
      name: '',
    },
    {
      id: 'B',
      conditionCode: 'question-hint-tutorbot',
      assignmentWeight: 50,
      description: null,
      order: 2,
      name: '',
    },
  ],
  conditionPayloads: [
    {
      id: 'E',
      payload: {
        type: PAYLOAD_TYPE.STRING,
        value: 'question-hint-default',
      },
      parentCondition: 'A',
      decisionPoint: 'C',
    },
    {
      id: 'F',
      payload: {
        type: PAYLOAD_TYPE.STRING,
        value: 'question-hint-tutorbot',
      },
      parentCondition: 'B',
      decisionPoint: 'C',
    },
  ],
  partitions: [
    {
      id: 'C',
      site: 'lesson-stream',
      target: 'question-hint',
      description: '',
      order: 1,
      excludeIfReached: false,
    },
  ],
  experimentSegmentInclusion: [
    {
      segment: {
        individualForSegment: [],
        groupForSegment: [
          {
            type: 'All',
            groupId: 'All',
          },
        ],
        subSegments: [],
        type: SEGMENT_TYPE.PRIVATE,
      },
    },
  ],
  experimentSegmentExclusion: [
    {
      segment: {
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.PRIVATE,
      },
    },
  ],
  filterMode: FILTER_MODE.EXCLUDE_ALL,
  queries: [],
  endOn: null,
  enrollmentCompleteCondition: null,
  startOn: null,
  state: EXPERIMENT_STATE.ENROLLING,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  revertTo: null,
  moocletPolicyParameters: mockTSConfigMoocletPolicyParameters,
};

describe('#MoocletExperimentService', () => {
  let moocletExperimentService: MoocletExperimentService;
  let moocletDataService: MoocletDataService;
  let experimentRepository: ExperimentRepository;
  let experimentConditionRepository: ExperimentConditionRepository;
  let decisionPointRepository: DecisionPointRepository;
  let experimentAuditLogRepository: ExperimentAuditLogRepository;
  let segmentRepository: SegmentRepository;
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
  let metricService: MetricService;
  let moocletRewardsService: MoocletRewardsService;

  beforeEach(() => {
    moocletDataService = {
      deleteMooclet: jest.fn(),
      deletePolicyParameters: jest.fn(),
      deleteVariable: jest.fn(),
    } as unknown as MoocletDataService;

    metricService = {
      saveAllMetrics: jest.fn(),
      delete: jest.fn(),
    } as unknown as MetricService;

    moocletRewardsService = {
      createAndSaveRewardMetric: jest.fn(),
      getRewardMetricQuery: jest.fn(),
    } as unknown as MoocletRewardsService;

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
      segmentRepository,
      moocletExperimentRefRepository,
      mockDataSource,
      previewUserService,
      segmentService,
      scheduledJobService,
      errorService,
      cacheService,
      queryService,
      metricService,
      moocletRewardsService
    );
  });

  const logger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as unknown as UpgradeLogger;

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
        versionConditionMaps: [],
      } as MoocletExperimentRef;

      manager = mockDataSource.manager as EntityManager;
      params = {
        experimentDTO: moocletExperimentDataTSConfigurable,
        currentUser: {} as UserDTO,
        logger,
      };

      // Spy on class methods
      jest.spyOn(moocletExperimentService as any, 'createExperiment').mockResolvedValue(mockExperimentResponse);
      jest
        .spyOn(moocletExperimentService as any, 'orchestrateMoocletCreation')
        .mockResolvedValue(mockMoocletExperimentRefResponse);
      jest.spyOn(moocletExperimentService as any, 'saveMoocletExperimentRef').mockResolvedValue(undefined);
      jest
        .spyOn(moocletExperimentService as any, 'createAndSaveVersionConditionMapEntities')
        .mockResolvedValue(undefined);
      jest.spyOn(moocletExperimentService as any, 'orchestrateDeleteMoocletResources').mockResolvedValue(undefined);
      jest.spyOn(moocletRewardsService as any, 'createAndSaveRewardMetric').mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully create a mooclet experiment with all required resources', async () => {
      const result = await moocletExperimentService['handleCreateMoocletTransaction'](manager, params);

      // Verify all methods were called with correct parameters
      expect(moocletExperimentService['createExperiment']).toHaveBeenCalledWith(manager, params);

      expect(moocletExperimentService['orchestrateMoocletCreation']).toHaveBeenCalledWith(
        mockExperimentResponse,
        params.experimentDTO.moocletPolicyParameters,
        logger
      );

      expect(moocletExperimentService['saveMoocletExperimentRef']).toHaveBeenCalledWith(
        manager,
        mockMoocletExperimentRefResponse
      );

      expect(moocletExperimentService['createAndSaveVersionConditionMapEntities']).toHaveBeenCalledWith(
        manager,
        mockMoocletExperimentRefResponse.id,
        mockMoocletExperimentRefResponse.versionConditionMaps,
        logger
      );

      expect(moocletExperimentService.orchestrateDeleteMoocletResources).not.toHaveBeenCalled();
      expect(moocletRewardsService.createAndSaveRewardMetric).toHaveBeenCalled();

      // Verify the result
      expect(result).toEqual({
        ...mockExperimentResponse,
        moocletPolicyParameters: params.experimentDTO.moocletPolicyParameters,
      });

      // Verify orchestrateDeleteMoocletResources was not called
      expect(moocletExperimentService['orchestrateDeleteMoocletResources']).not.toHaveBeenCalled();
    });

    it('should handle failure during createExperiment and throw error', async () => {
      const error = new Error('Failed to create experiment');
      jest.spyOn(moocletExperimentService as any, 'createExperiment').mockRejectedValue(error);

      await expect(moocletExperimentService['handleCreateMoocletTransaction'](manager, params)).rejects.toThrow(error);

      // Verify subsequent methods were not called
      expect(moocletExperimentService['orchestrateMoocletCreation']).not.toHaveBeenCalled();
      expect(moocletExperimentService['saveMoocletExperimentRef']).not.toHaveBeenCalled();
      expect(moocletExperimentService['createAndSaveVersionConditionMapEntities']).not.toHaveBeenCalled();
    });

    it('should handle failure during orchestrateMoocletCreation and throw error', async () => {
      const error = new Error('Failed to create mooclet resources');
      jest.spyOn(moocletExperimentService as any, 'orchestrateMoocletCreation').mockRejectedValue(error);

      await expect(moocletExperimentService['handleCreateMoocletTransaction'](manager, params)).rejects.toThrow(error);

      // Verify subsequent methods were not called
      expect(moocletExperimentService['saveMoocletExperimentRef']).not.toHaveBeenCalled();
      expect(moocletExperimentService['createAndSaveVersionConditionMapEntities']).not.toHaveBeenCalled();
    });

    it('should handle failure during saveMoocletExperimentRef and cleanup resources', async () => {
      const error = new Error('Failed to save mooclet ref');
      jest.spyOn(moocletExperimentService as any, 'saveMoocletExperimentRef').mockRejectedValue(error);

      await expect(moocletExperimentService['handleCreateMoocletTransaction'](manager, params)).rejects.toThrow(error);

      // Verify cleanup was called
      expect(moocletExperimentService['orchestrateDeleteMoocletResources']).toHaveBeenCalledWith(
        mockMoocletExperimentRefResponse,
        logger
      );
    });

    it('should handle failure during createAndSaveVersionConditionMapEntities and cleanup resources', async () => {
      const error = new Error('Failed to save version condition maps');
      jest.spyOn(moocletExperimentService as any, 'createAndSaveVersionConditionMapEntities').mockRejectedValue(error);

      await expect(moocletExperimentService['handleCreateMoocletTransaction'](manager, params)).rejects.toThrow(error);

      // Verify cleanup was called
      expect(moocletExperimentService['orchestrateDeleteMoocletResources']).toHaveBeenCalledWith(
        mockMoocletExperimentRefResponse,
        logger
      );
    });
  });

  describe('#orchestrateMoocletCreation', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should orchestrate mooclet creation successfully', async () => {
      const mockMoocletPolicy = { id: 'mockMoocletPolicy123' };
      const mockMoocletResponse = { id: 'mockMoocletResponse' };
      const mockMoocletVersionsResponse = [{ id: 'mockMoocletVersionsResponse' }];
      const mockMoocletPolicyParametersResponse = { id: 'mockMoocletPolicyParametersResponse' };
      const mockMoocletVariableResponse = { id: 'mockMoocletVariableResponse' };

      jest.spyOn(moocletExperimentService as any, 'getMoocletPolicy').mockResolvedValue(mockMoocletPolicy);
      jest.spyOn(moocletExperimentService as any, 'createMooclet').mockResolvedValue(mockMoocletResponse);
      jest
        .spyOn(moocletExperimentService as any, 'createMoocletVersions')
        .mockResolvedValue(mockMoocletVersionsResponse);
      jest.spyOn(moocletExperimentService as any, 'createMoocletVersionConditionMaps').mockReturnValue([]);
      jest
        .spyOn(moocletExperimentService as any, 'createPolicyParameters')
        .mockResolvedValue(mockMoocletPolicyParametersResponse);
      jest
        .spyOn(moocletExperimentService as any, 'createVariableIfNeeded')
        .mockResolvedValue(mockMoocletVariableResponse);
      jest.spyOn(moocletExperimentService as any, 'orchestrateDeleteMoocletResources').mockResolvedValue(undefined);

      const result = await moocletExperimentService.orchestrateMoocletCreation(
        moocletExperimentDataTSConfigurable,
        mockTSConfigMoocletPolicyParameters,
        logger
      );

      expect(result).toBeDefined();
      expect(result?.experimentId).toBe(moocletExperimentDataTSConfigurable.id);
      expect(result?.moocletId).toBe(mockMoocletResponse.id);
      expect(result?.policyParametersId).toBe(mockMoocletPolicyParametersResponse.id);
      expect(result?.variableId).toBe(mockMoocletVariableResponse.id);
      expect(moocletExperimentService.orchestrateDeleteMoocletResources).not.toHaveBeenCalled();
    });

    it('should handle errors and orchestrate deletion of mooclet resources', async () => {
      const mockError = new Error('Test Error');

      jest.spyOn(moocletExperimentService as any, 'getMoocletPolicy').mockRejectedValue(mockError);
      jest.spyOn(moocletExperimentService as any, 'orchestrateDeleteMoocletResources').mockRejectedValue(mockError);

      await expect(
        moocletExperimentService.orchestrateMoocletCreation(
          moocletExperimentDataTSConfigurable,
          mockTSConfigMoocletPolicyParameters,
          logger
        )
      ).rejects.toThrow(mockError);
      expect(moocletExperimentService.orchestrateDeleteMoocletResources).toHaveBeenCalled();
    });
  });

  describe('#orchestrateDeleteMoocletResources', () => {
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.moocletId = 1;
    mockMoocletExperimentRef.policyParametersId = 2;
    mockMoocletExperimentRef.variableId = 3;
    mockMoocletExperimentRef.id = 'mockMoocletExperimentRef123';
    mockMoocletExperimentRef.versionConditionMaps = [];

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should delete all mooclet resources successfully', async () => {
      jest.spyOn(moocletDataService, 'deleteMooclet').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deletePolicyParameters').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deleteVariable').mockResolvedValue(undefined);

      await moocletExperimentService.orchestrateDeleteMoocletResources(mockMoocletExperimentRef, logger);

      expect(moocletDataService.deleteMooclet).toHaveBeenCalledWith(mockMoocletExperimentRef.moocletId, logger);
      expect(moocletDataService.deletePolicyParameters).toHaveBeenCalledWith(
        mockMoocletExperimentRef.policyParametersId,
        logger
      );
      expect(moocletDataService.deleteVariable).toHaveBeenCalledWith(mockMoocletExperimentRef.variableId, logger);
    });
    it('should handle errors and log them', async () => {
      jest.spyOn(moocletDataService, 'deleteMooclet').mockRejectedValue(new Error('Failed to delete mooclet'));
      jest.spyOn(moocletExperimentService as any, 'deleteMoocletVersions').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deletePolicyParameters').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deleteVariable').mockResolvedValue(undefined);

      await expect(
        moocletExperimentService.orchestrateDeleteMoocletResources(mockMoocletExperimentRef, logger)
      ).rejects.toThrow();

      expect(moocletDataService.deleteMooclet).toHaveBeenCalledWith(mockMoocletExperimentRef.moocletId, logger);
      expect(moocletDataService.deletePolicyParameters).not.toHaveBeenCalled();
      expect(moocletDataService.deleteVariable).not.toHaveBeenCalled();
    });
  });
});
