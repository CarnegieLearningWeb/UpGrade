import 'reflect-metadata';
import { ExperimentDTO } from '../../../../Upgrade/src/api/DTO/ExperimentDTO';
import { UserDTO } from '../../../../Upgrade/src/api/DTO/UserDTO';
import { MoocletExperimentRef } from '../../../src/api/models/MoocletExperimentRef';
import { MoocletVersionConditionMap } from '../../../src/api/models/MoocletVersionConditionMap';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';
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
import {
  MoocletExperimentService,
  SyncCreateParams,
  SyncEditParams,
  SyncDeleteParams,
} from '../../../src/api/services/MoocletExperimentService';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { QueryService } from '../../../src/api/services/QueryService';
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
import { ExperimentSchedulerService } from '../../../src/api/services/ExperimentSchedulerService';

const mockDataSource = {
  initialize: jest.fn(),
  destroy: jest.fn(),
  transaction: jest.fn((callback) => callback(mockDataSource.manager)),
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

jest.mock('../../../src/env', () => ({
  env: {
    mooclets: {
      enabled: true,
    },
    aws: {
      region: 'us-east-1',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      s3BucketName: 'test',
    },
    app: {
      version: '1.0.0-test',
    },
  },
}));

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
  let experimentSchedulerService: ExperimentSchedulerService;
  let errorService: ErrorService;
  let cacheService: CacheService;
  let queryService: QueryService;
  let metricService: MetricService;

  beforeEach(() => {
    moocletDataService = {
      deleteMooclet: jest.fn(),
      deletePolicyParameters: jest.fn(),
      deleteVariable: jest.fn(),
      getPolicyParameters: jest.fn(),
      getVersionForNewLearner: jest.fn(),
      getVariable: jest.fn(),
    } as unknown as MoocletDataService;

    metricService = {
      saveAllMetrics: jest.fn(),
      delete: jest.fn(),
    } as unknown as MetricService;

    cacheService = {
      delCache: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheService;

    experimentRepository = {
      findOneExperiment: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as ExperimentRepository;

    moocletExperimentRefRepository = {
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as MoocletExperimentRefRepository;

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
      experimentSchedulerService,
      errorService,
      cacheService,
      queryService,
      metricService
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
        moocletPolicyParameters: mockTSConfigMoocletPolicyParameters,
      } as any as ExperimentDTO;

      mockMoocletExperimentRefResponse = {
        id: 'moocletRef-123',
        versionConditionMaps: [],
      } as MoocletExperimentRef;

      manager = mockDataSource.manager as EntityManager;
      params = {
        // Note: experimentDTO should already be the created experiment
        // since handleCreateMoocletTransaction is now called AFTER createUpgradeExperiment
        experimentDTO: mockExperimentResponse,
        currentUser: {} as UserDTO,
        logger,
      };

      // Spy on class methods
      jest
        .spyOn(moocletExperimentService as any, 'orchestrateMoocletCreation')
        .mockResolvedValue(mockMoocletExperimentRefResponse);
      jest.spyOn(moocletExperimentService as any, 'saveMoocletExperimentRef').mockResolvedValue(undefined);
      jest
        .spyOn(moocletExperimentService as any, 'createAndSaveVersionConditionMapEntities')
        .mockResolvedValue(undefined);
      jest.spyOn(moocletExperimentService as any, 'orchestrateDeleteMoocletResources').mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully create a mooclet experiment with all required resources', async () => {
      const result = await moocletExperimentService['handleCreateMoocletTransaction'](manager, params);

      // Verify orchestrateMoocletCreation was called with the experiment returned from createUpgradeExperiment
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

      // Verify the result
      expect(result).toEqual({
        ...mockExperimentResponse,
        moocletPolicyParameters: params.experimentDTO.moocletPolicyParameters,
      });

      // Verify orchestrateDeleteMoocletResources was not called
      expect(moocletExperimentService['orchestrateDeleteMoocletResources']).not.toHaveBeenCalled();
    });

    it('should use experimentDTO from params (not create new)', async () => {
      // Verify that handleCreateMoocletTransaction uses the experimentDTO passed in params
      // (it doesn't create a new experiment - that's done in syncCreate)
      const result = await moocletExperimentService['handleCreateMoocletTransaction'](manager, params);

      // orchestrateMoocletCreation should be called with params.experimentDTO
      expect(moocletExperimentService['orchestrateMoocletCreation']).toHaveBeenCalledWith(
        params.experimentDTO,
        params.experimentDTO.moocletPolicyParameters,
        logger
      );

      expect(result.id).toBe(params.experimentDTO.id);
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
    it('should handle errors, log them, and return false', async () => {
      const mockError = new Error('Failed to delete mooclet');
      jest.spyOn(moocletDataService, 'deleteMooclet').mockRejectedValue(mockError);
      jest.spyOn(moocletExperimentService as any, 'deleteMoocletVersions').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deletePolicyParameters').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deleteVariable').mockResolvedValue(undefined);

      const result = await moocletExperimentService.orchestrateDeleteMoocletResources(mockMoocletExperimentRef, logger);

      expect(result).toBe(false);
      expect(moocletDataService.deleteMooclet).toHaveBeenCalledWith(mockMoocletExperimentRef.moocletId, logger);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to delete Mooclet resources'),
          error: mockError,
          moocletExperimentRef: mockMoocletExperimentRef,
        })
      );
    });
  });

  describe('#handleDeleteMoocletTransaction', () => {
    const mockExperiment = {
      id: 'test-exp-123',
      name: 'Test Experiment',
      conditions: [],
    };

    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.moocletId = 1;
    mockMoocletExperimentRef.policyParametersId = 2;
    mockMoocletExperimentRef.variableId = 3;
    mockMoocletExperimentRef.id = 'mockMoocletExperimentRef123';
    mockMoocletExperimentRef.experimentId = 'test-exp-123';
    mockMoocletExperimentRef.versionConditionMaps = [];

    const mockUser = {
      id: 'user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
    } as UserDTO;

    const mockDeleteParams = {
      moocletExperimentRef: mockMoocletExperimentRef,
      experimentId: 'test-exp-123',
      currentUser: mockUser,
      logger,
    };

    const mockManager = mockDataSource.manager as EntityManager;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should rollback upgrade experiment deletion when mooclet deletion fails', async () => {
      // Mock the parent class delete method
      const deleteSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(moocletExperimentService)), 'delete')
        .mockResolvedValue(mockExperiment);

      // Mock orchestrateDeleteMoocletResources to fail (return false)
      const orchestrateSpy = jest
        .spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources')
        .mockResolvedValue(false);

      // Call the private method directly
      await expect(
        (moocletExperimentService as any).handleDeleteMoocletTransaction(mockManager, mockDeleteParams)
      ).rejects.toThrow(/Failed to delete Mooclet resources, aborting transaction to preserve upgrade experiment/);

      // Verify that upgrade deletion was attempted first
      expect(deleteSpy).toHaveBeenCalledWith('test-exp-123', mockUser, {
        existingEntityManager: mockManager,
      });

      // Verify that mooclet deletion was attempted
      expect(orchestrateSpy).toHaveBeenCalledWith(mockMoocletExperimentRef, logger);
    });

    it('should successfully delete both resources when mooclet deletion succeeds', async () => {
      // Mock the parent class delete method
      const deleteSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(moocletExperimentService)), 'delete')
        .mockResolvedValue(mockExperiment);

      // Mock orchestrateDeleteMoocletResources to succeed (return true)
      const orchestrateSpy = jest
        .spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources')
        .mockResolvedValue(true);

      // Call the private method directly
      const result = await (moocletExperimentService as any).handleDeleteMoocletTransaction(
        mockManager,
        mockDeleteParams
      );

      expect(result).toEqual(mockExperiment);
      expect(deleteSpy).toHaveBeenCalledWith('test-exp-123', mockUser, {
        existingEntityManager: mockManager,
      });
      expect(orchestrateSpy).toHaveBeenCalledWith(mockMoocletExperimentRef, logger);
    });

    it('should throw error if upgrade experiment deletion fails (before mooclet deletion)', async () => {
      const deleteError = new Error('Database error: cannot delete experiment');

      // Mock the parent class delete method to fail
      const deleteSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(moocletExperimentService)), 'delete')
        .mockRejectedValue(deleteError);

      // Mock orchestrateDeleteMoocletResources (should not be called)
      const orchestrateSpy = jest.spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources');

      // Call the private method directly
      await expect(
        (moocletExperimentService as any).handleDeleteMoocletTransaction(mockManager, mockDeleteParams)
      ).rejects.toThrow(deleteError);

      // Verify upgrade deletion was attempted
      expect(deleteSpy).toHaveBeenCalledWith('test-exp-123', mockUser, {
        existingEntityManager: mockManager,
      });

      // Mooclet deletion should not be attempted if upgrade deletion fails
      expect(orchestrateSpy).not.toHaveBeenCalled();
    });
  });

  describe('#handlePotentialMoocletAssignmentAlgorithmChange', () => {
    const currentUser = {
      id: 'user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    } as UserDTO;
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.id = 'mooclet-ref-123';
    mockMoocletExperimentRef.moocletId = 1;
    mockMoocletExperimentRef.experimentId = 'test-exp-123';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('Algorithm changes involving mooclets', () => {
      it('should handle Mooclet A → Mooclet B (fetch, update+create, delete) in INACTIVE state', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.INACTIVE,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        };
        const updatedExperiment = { ...experiment, name: 'Updated' };

        // Mock checkForMoocletAssignmentAlgorithmChange
        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: true,
          wasMooclet: true,
          isNowMooclet: true,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        });

        // Mock getMoocletExperimentRefByUpgradeExperimentId (should be called to fetch old ref)
        jest
          .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
          .mockResolvedValue(mockMoocletExperimentRef);

        // Mock syncUpdateWithNewMoocletResources (should be called to update + create new)
        jest
          .spyOn(moocletExperimentService, 'syncUpdateWithMoocletAlgorithmTransition')
          .mockResolvedValue(updatedExperiment);

        // Mock orchestrateDeleteMoocletResources (should be called AFTER update)
        jest.spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources').mockResolvedValue(true);

        const result = await moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(
          experiment,
          currentUser,
          logger
        );

        // Verify order of operations
        expect(moocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId).toHaveBeenCalledWith(
          experiment.id
        );
        expect(moocletExperimentService.syncUpdateWithMoocletAlgorithmTransition).toHaveBeenCalledWith({
          experimentDTO: experiment,
          currentUser,
          logger,
          moocletRefToDelete: mockMoocletExperimentRef,
        });
        expect(moocletExperimentService.orchestrateDeleteMoocletResources).toHaveBeenCalledWith(
          mockMoocletExperimentRef,
          logger
        );

        // Verify order: fetch called before update, update called before delete
        const fetchOrder = (moocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId as jest.Mock).mock
          .invocationCallOrder[0];
        const updateOrder = (moocletExperimentService.syncUpdateWithMoocletAlgorithmTransition as jest.Mock).mock
          .invocationCallOrder[0];
        const deleteOrder = (moocletExperimentService.orchestrateDeleteMoocletResources as jest.Mock).mock
          .invocationCallOrder[0];
        expect(fetchOrder).toBeLessThan(updateOrder);
        expect(updateOrder).toBeLessThan(deleteOrder);

        expect(result).toEqual(updatedExperiment);
      });

      it('should handle Mooclet → Non-mooclet (fetch, update, delete) in INACTIVE state', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.INACTIVE,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        };
        const updatedExperiment = { ...experiment };

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: true,
          wasMooclet: true,
          isNowMooclet: false,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        });

        jest
          .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
          .mockResolvedValue(mockMoocletExperimentRef);

        // Directly mock the update method (simpler than mocking all internal dependencies)
        const updateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(moocletExperimentService)), 'update');
        updateSpy.mockResolvedValue(updatedExperiment);

        jest.spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources').mockResolvedValue(true);

        const result = await moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(
          experiment,
          currentUser,
          logger
        );

        expect(moocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId).toHaveBeenCalledWith(
          experiment.id
        );
        expect(updateSpy).toHaveBeenCalledWith(experiment, currentUser, logger, mockDataSource.manager);
        expect(moocletExperimentService.orchestrateDeleteMoocletResources).toHaveBeenCalledWith(
          mockMoocletExperimentRef,
          logger
        );

        expect(result).toEqual(updatedExperiment);

        updateSpy.mockRestore();
      });

      it('should handle Non-mooclet → Mooclet (no fetch, update+create, no delete) in INACTIVE state', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.INACTIVE,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        };
        const updatedExperiment = { ...experiment };

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: true,
          wasMooclet: false,
          isNowMooclet: true,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        });

        jest
          .spyOn(moocletExperimentService, 'syncUpdateWithMoocletAlgorithmTransition')
          .mockResolvedValue(updatedExperiment);

        jest.spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId');
        jest.spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources');

        const result = await moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(
          experiment,
          currentUser,
          logger
        );

        // Verify no fetch since wasMooclet is false
        expect(moocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId).not.toHaveBeenCalled();

        expect(moocletExperimentService.syncUpdateWithMoocletAlgorithmTransition).toHaveBeenCalledWith({
          experimentDTO: experiment,
          currentUser,
          logger,
          moocletRefToDelete: undefined,
        });

        // Verify no delete since nothing to delete
        expect(moocletExperimentService.orchestrateDeleteMoocletResources).not.toHaveBeenCalled();

        expect(result).toEqual(updatedExperiment);
      });

      it('should throw error for algorithm change in non-INACTIVE state (ENROLLING)', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.ENROLLING,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        };

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: true,
          wasMooclet: true,
          isNowMooclet: false,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        });

        await expect(
          moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(experiment, currentUser, logger)
        ).rejects.toThrow(/INACTIVE state/);
      });

      it('should gracefully handle deletion failure (log but not throw)', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.INACTIVE,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        };
        const updatedExperiment = { ...experiment };
        const deletionError = new Error('Mooclet API unavailable');

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: true,
          wasMooclet: true,
          isNowMooclet: false,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        });

        jest
          .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
          .mockResolvedValue(mockMoocletExperimentRef);

        // Directly mock the update method
        const updateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(moocletExperimentService)), 'update');
        updateSpy.mockResolvedValue(updatedExperiment);

        // Mock deletion failure
        jest.spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources').mockRejectedValue(deletionError);

        // Should not throw - deletion failure should be caught and logged
        const result = await moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(
          experiment,
          currentUser,
          logger
        );

        expect(result).toEqual(updatedExperiment);
        expect(logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Failed to delete old mooclet resources'),
          })
        );

        updateSpy.mockRestore();
      });

      it('should not delete if update fails (transaction safety)', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.INACTIVE,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        };
        const updateError = new Error('Database error');

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: true,
          wasMooclet: true,
          isNowMooclet: false,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        });

        jest
          .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
          .mockResolvedValue(mockMoocletExperimentRef);

        // Mock the update method to fail
        const updateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(moocletExperimentService)), 'update');
        updateSpy.mockRejectedValue(updateError);

        jest.spyOn(moocletExperimentService, 'orchestrateDeleteMoocletResources');

        await expect(
          moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(experiment, currentUser, logger)
        ).rejects.toThrow(updateError);

        // Verify deletion was NOT called since update failed
        expect(moocletExperimentService.orchestrateDeleteMoocletResources).not.toHaveBeenCalled();

        updateSpy.mockRestore();
      });
    });

    describe('Regular mooclet updates (no algorithm change)', () => {
      it('should handle regular mooclet update in ENROLLING state (allowed)', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.ENROLLING,
        };
        const updatedExperiment = { ...experiment, name: 'Updated name' };

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: false,
          wasMooclet: true,
          isNowMooclet: true,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        });

        jest.spyOn(moocletExperimentService, 'syncUpdate').mockResolvedValue(updatedExperiment);

        const result = await moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(
          experiment,
          currentUser,
          logger
        );

        expect(moocletExperimentService.syncUpdate).toHaveBeenCalledWith({
          experimentDTO: experiment,
          currentUser,
          logger,
        });
        expect(result).toEqual(updatedExperiment);
      });
    });

    describe('Non-mooclet updates', () => {
      it('should throw error for non-mooclet algorithm changes in non-INACTIVE state', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.ENROLLING,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING,
        };

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: true,
          wasMooclet: false,
          isNowMooclet: false,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        });

        await expect(
          moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(experiment, currentUser, logger)
        ).rejects.toThrow(/INACTIVE state/);
      });

      it('should return null for non-mooclet experiments (let controller handle)', async () => {
        const experiment = {
          ...moocletExperimentDataTSConfigurable,
          state: EXPERIMENT_STATE.ENROLLING,
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        };

        jest.spyOn(moocletExperimentService, 'checkForMoocletAssignmentAlgorithmChange').mockResolvedValue({
          hasChanged: false,
          wasMooclet: false,
          isNowMooclet: false,
          oldAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        });

        const result = await moocletExperimentService.handlePotentialMoocletAssignmentAlgorithmChange(
          experiment,
          currentUser,
          logger
        );

        expect(result).toBeNull();
      });
    });
  });

  describe('#syncCreate', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create experiment and mooclet resources in a transaction', async () => {
      const experimentDTO = { ...moocletExperimentDataTSConfigurable } as ExperimentDTO;
      const currentUser = { id: 'user-123' } as any as UserDTO;
      const params: SyncCreateParams = { experimentDTO, currentUser, logger };

      const createdExperiment = { ...experimentDTO, id: 'new-exp-id' };
      jest.spyOn(moocletExperimentService as any, 'createUpgradeExperiment').mockResolvedValue(createdExperiment);
      jest
        .spyOn(moocletExperimentService as any, 'handleCreateMoocletTransaction')
        .mockResolvedValue(createdExperiment);

      const result = await moocletExperimentService.syncCreate(params);

      expect(result).toEqual(createdExperiment);
    });
  });

  describe('#syncUpdate', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update experiment and mooclet resources in a transaction', async () => {
      const experimentDTO = { ...moocletExperimentDataTSConfigurable } as ExperimentDTO;
      const currentUser = { id: 'user-123' } as any as UserDTO;
      const params: SyncEditParams = { experimentDTO, currentUser, logger };

      const updatedExperiment = { ...experimentDTO, name: 'Updated' };
      jest.spyOn(moocletExperimentService as any, 'handleEditMoocletTransaction').mockResolvedValue(updatedExperiment);

      const result = await moocletExperimentService.syncUpdate(params);

      expect(result).toEqual(updatedExperiment);
    });
  });

  describe('#syncUpdateWithMoocletAlgorithmTransition', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update experiment and create new mooclet resources when transitioning to mooclet', async () => {
      const experimentDTO = {
        ...moocletExperimentDataTSConfigurable,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      } as ExperimentDTO;
      const currentUser = { id: 'user-123' } as any as UserDTO;
      const params: SyncEditParams = { experimentDTO, currentUser, logger };

      const updatedExperiment = { ...experimentDTO };
      jest.spyOn(moocletExperimentService as any, 'updateUpgradeExperiment').mockResolvedValue(updatedExperiment);
      jest
        .spyOn(moocletExperimentService as any, 'handleCreateMoocletTransaction')
        .mockResolvedValue(updatedExperiment);
      jest.spyOn(moocletExperimentService, 'isMoocletExperiment').mockReturnValue(true);

      const result = await moocletExperimentService.syncUpdateWithMoocletAlgorithmTransition(params);

      expect(result).toEqual(updatedExperiment);
      expect(moocletExperimentService['updateUpgradeExperiment']).toHaveBeenCalled();
      expect(moocletExperimentService['handleCreateMoocletTransaction']).toHaveBeenCalled();
    });

    it('should update experiment and delete old mooclet ref when transitioning away from mooclet', async () => {
      const mockMoocletRef = new MoocletExperimentRef();
      mockMoocletRef.id = 'ref-123';

      const experimentDTO = {
        ...moocletExperimentDataTSConfigurable,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
      } as ExperimentDTO;
      const currentUser = { id: 'user-123' } as any as UserDTO;
      const params: SyncEditParams = { experimentDTO, currentUser, logger, moocletRefToDelete: mockMoocletRef };

      const updatedExperiment = { ...experimentDTO };
      jest.spyOn(moocletExperimentService as any, 'updateUpgradeExperiment').mockResolvedValue(updatedExperiment);
      jest.spyOn(moocletExperimentService, 'isMoocletExperiment').mockReturnValue(false);
      jest.spyOn(moocletExperimentRefRepository, 'delete').mockResolvedValue(undefined);

      const result = await moocletExperimentService.syncUpdateWithMoocletAlgorithmTransition(params);

      expect(result).toEqual(updatedExperiment);
      expect(moocletExperimentRefRepository.delete).toHaveBeenCalledWith(mockMoocletRef.id);
    });
  });

  describe('#syncDelete', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should delete experiment and mooclet resources in a transaction', async () => {
      const mockMoocletRef = new MoocletExperimentRef();
      mockMoocletRef.id = 'ref-123';

      const currentUser = { id: 'user-123' } as any as UserDTO;
      const params: SyncDeleteParams = {
        moocletExperimentRef: mockMoocletRef,
        experimentId: 'exp-123',
        currentUser,
        logger,
      };

      const deletedExperiment = { id: 'exp-123' } as any as Experiment;
      jest
        .spyOn(moocletExperimentService as any, 'handleDeleteMoocletTransaction')
        .mockResolvedValue(deletedExperiment);

      const result = await moocletExperimentService.syncDelete(params);

      expect(result).toEqual(deletedExperiment);
    });
  });

  describe('#isMoocletExperiment', () => {
    it('should return true for mooclet algorithms', () => {
      expect(moocletExperimentService.isMoocletExperiment(ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE)).toBe(true);
    });

    it('should return false for non-mooclet algorithms', () => {
      expect(moocletExperimentService.isMoocletExperiment(ASSIGNMENT_ALGORITHM.RANDOM)).toBe(false);
      expect(moocletExperimentService.isMoocletExperiment(ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING)).toBe(false);
    });
  });

  describe('#checkForMoocletAssignmentAlgorithmChange', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should detect algorithm change from mooclet to non-mooclet', async () => {
      const oldExperiment = {
        id: 'exp-123',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      };
      const newExperiment = {
        id: 'exp-123',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
      } as ExperimentDTO;

      jest.spyOn(moocletExperimentService, 'findOne').mockResolvedValue(oldExperiment as any);

      const result = await moocletExperimentService.checkForMoocletAssignmentAlgorithmChange(newExperiment, logger);

      expect(result).toEqual({
        hasChanged: true,
        wasMooclet: true,
        isNowMooclet: false,
        oldAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      });
    });

    it('should detect no change when algorithm stays the same', async () => {
      const oldExperiment = {
        id: 'exp-123',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
      };
      const newExperiment = {
        id: 'exp-123',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
      } as ExperimentDTO;

      jest.spyOn(moocletExperimentService, 'findOne').mockResolvedValue(oldExperiment as any);

      const result = await moocletExperimentService.checkForMoocletAssignmentAlgorithmChange(newExperiment, logger);

      expect(result).toEqual({
        hasChanged: false,
        wasMooclet: false,
        isNowMooclet: false,
        oldAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
      });
    });

    it('should throw error when experiment not found', async () => {
      const newExperiment = { id: 'exp-123', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM } as ExperimentDTO;

      jest.spyOn(moocletExperimentService, 'findOne').mockResolvedValue(null);

      await expect(
        moocletExperimentService.checkForMoocletAssignmentAlgorithmChange(newExperiment, logger)
      ).rejects.toThrow(/Experiment unexpectedly not found/);
    });
  });

  describe('#attachPolicyParamsToExperimentDTO', () => {
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.policyParametersId = 123;
    mockMoocletExperimentRef.versionConditionMaps = [
      {
        moocletVersionId: 1,
        experimentCondition: { conditionCode: 'control' } as any,
      } as MoocletVersionConditionMap,
      {
        moocletVersionId: 2,
        experimentCondition: { conditionCode: 'treatment' } as any,
      } as MoocletVersionConditionMap,
    ];

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should attach policy parameters to experiment DTO', async () => {
      const experiment = { id: 'exp-123' } as ExperimentDTO;
      const mockPolicyParams = {
        parameters: {
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
          prior: { success: 1, failure: 1 },
        },
      };

      jest
        .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue(mockMoocletExperimentRef);
      jest.spyOn(moocletDataService, 'getPolicyParameters').mockResolvedValue(mockPolicyParams as any);

      const result = await moocletExperimentService.attachPolicyParamsToExperimentDTO(experiment, logger);

      expect(result.moocletPolicyParameters).toEqual(mockPolicyParams.parameters);
    });

    it('should transform current_posteriors from version IDs to condition codes', async () => {
      const experiment = { id: 'exp-123' } as ExperimentDTO;
      const mockPolicyParams = {
        parameters: {
          assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
          current_posteriors: {
            '1': { success: 5, failure: 2 },
            '2': { success: 3, failure: 4 },
          },
        },
      };

      jest
        .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue(mockMoocletExperimentRef);
      jest.spyOn(moocletDataService, 'getPolicyParameters').mockResolvedValue(mockPolicyParams as any);

      const result = await moocletExperimentService.attachPolicyParamsToExperimentDTO(experiment, logger);

      expect(result.moocletPolicyParameters['current_posteriors']).toEqual({
        control: { success: 5, failure: 2 },
        treatment: { success: 3, failure: 4 },
      });
    });

    it('should throw error if policy parameters cannot be fetched', async () => {
      const experiment = { id: 'exp-123' } as ExperimentDTO;

      jest
        .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue(mockMoocletExperimentRef);
      jest.spyOn(moocletDataService, 'getPolicyParameters').mockRejectedValue(new Error('API error'));

      await expect(moocletExperimentService.attachPolicyParamsToExperimentDTO(experiment, logger)).rejects.toThrow(
        /Failed to get Mooclet policy parameters/
      );
    });
  });

  describe('#getConditionFromMoocletProxy', () => {
    const mockExperiment = { id: 'exp-123' } as Experiment;
    const mockUserId = 'user-456';
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.moocletId = 1;
    mockMoocletExperimentRef.versionConditionMaps = [
      {
        moocletVersionId: 10,
        experimentCondition: { id: 'cond-1', conditionCode: 'control' } as ExperimentCondition,
      } as MoocletVersionConditionMap,
    ];

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should get condition from mooclet proxy', async () => {
      const mockVersionResponse = { id: 10, name: 'control' };

      jest
        .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue(mockMoocletExperimentRef);
      jest.spyOn(moocletDataService, 'getVersionForNewLearner').mockResolvedValue(mockVersionResponse as any);

      const result = await moocletExperimentService.getConditionFromMoocletProxy(mockExperiment, mockUserId, logger);

      expect(result).toEqual(mockMoocletExperimentRef.versionConditionMaps[0].experimentCondition);
      expect(moocletDataService.getVersionForNewLearner).toHaveBeenCalledWith(
        mockMoocletExperimentRef.moocletId,
        mockUserId,
        logger
      );
    });

    it('should throw error if version not found in maps', async () => {
      const mockVersionResponse = { id: 999, name: 'unknown' };

      jest
        .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue(mockMoocletExperimentRef);
      jest.spyOn(moocletDataService, 'getVersionForNewLearner').mockResolvedValue(mockVersionResponse as any);

      await expect(
        moocletExperimentService.getConditionFromMoocletProxy(mockExperiment, mockUserId, logger)
      ).rejects.toThrow(/Version ID not found in version condition maps/);
    });
  });

  describe('#handleEnrollCondition', () => {
    const mockExperimentId = 'exp-123';
    const mockConditionCode = 'control';
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.versionConditionMaps = [
      {
        experimentCondition: { id: 'cond-1', conditionCode: 'control' } as ExperimentCondition,
      } as MoocletVersionConditionMap,
    ];

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return experiment condition for valid condition code', async () => {
      jest
        .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue(mockMoocletExperimentRef);

      const result = await moocletExperimentService.handleEnrollCondition(mockExperimentId, mockConditionCode, logger);

      expect(result).toEqual(mockMoocletExperimentRef.versionConditionMaps[0].experimentCondition);
    });

    it('should throw error if mooclet experiment ref not found', async () => {
      jest.spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId').mockResolvedValue(null);

      await expect(
        moocletExperimentService.handleEnrollCondition(mockExperimentId, mockConditionCode, logger)
      ).rejects.toThrow(/No MoocletExperimentRef found/);
    });

    it('should throw error if condition code not found in version maps', async () => {
      jest
        .spyOn(moocletExperimentService, 'getMoocletExperimentRefByUpgradeExperimentId')
        .mockResolvedValue(mockMoocletExperimentRef);

      await expect(
        moocletExperimentService.handleEnrollCondition(mockExperimentId, 'unknown-condition', logger)
      ).rejects.toThrow(/No version found for condition/);
    });
  });

  describe('Detection methods', () => {
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.versionConditionMaps = [
      {
        experimentConditionId: 'cond-1',
        experimentCondition: { id: 'cond-1', conditionCode: 'control' } as any as ExperimentCondition,
      } as any as MoocletVersionConditionMap,
    ];

    describe('#detectNewOutcomeVariableName', () => {
      it('should detect changed outcome variable name', () => {
        const experimentDTO = {
          moocletPolicyParameters: { outcome_variable_name: 'new_variable' },
        } as any as ExperimentDTO;

        const result = moocletExperimentService['detectNewOutcomeVariableName'](experimentDTO, 'old_variable');

        expect(result).toBe('new_variable');
      });

      it('should return null if outcome variable name unchanged', () => {
        const experimentDTO = {
          moocletPolicyParameters: { outcome_variable_name: 'same_variable' },
        } as any as ExperimentDTO;

        const result = moocletExperimentService['detectNewOutcomeVariableName'](experimentDTO, 'same_variable');

        expect(result).toBeNull();
      });
    });

    describe('#detectNewConditions', () => {
      it('should detect new conditions', () => {
        const experimentDTO = {
          conditions: [
            { id: 'cond-1', conditionCode: 'control' },
            { id: 'cond-2', conditionCode: 'treatment' },
          ],
        } as ExperimentDTO;

        const result = moocletExperimentService['detectNewConditions'](experimentDTO, mockMoocletExperimentRef);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('cond-2');
      });

      it('should return null if no new conditions', () => {
        const experimentDTO = {
          conditions: [{ id: 'cond-1', conditionCode: 'control' }],
        } as ExperimentDTO;

        const result = moocletExperimentService['detectNewConditions'](experimentDTO, mockMoocletExperimentRef);

        expect(result).toBeNull();
      });
    });

    describe('#detectRemovedConditions', () => {
      it('should detect removed conditions', () => {
        const experimentDTO = {
          conditions: [],
        } as ExperimentDTO;

        const result = moocletExperimentService['detectRemovedConditions'](experimentDTO, mockMoocletExperimentRef);

        expect(result).toHaveLength(1);
        expect(result[0].experimentConditionId).toBe('cond-1');
      });

      it('should return null if no conditions removed', () => {
        const experimentDTO = {
          conditions: [{ id: 'cond-1', conditionCode: 'control' }],
        } as ExperimentDTO;

        const result = moocletExperimentService['detectRemovedConditions'](experimentDTO, mockMoocletExperimentRef);

        expect(result).toBeNull();
      });
    });

    describe('#detectModifiedConditions', () => {
      it('should detect modified condition codes', () => {
        const experimentDTO = {
          conditions: [{ id: 'cond-1', conditionCode: 'modified_control' }],
        } as ExperimentDTO;

        const result = moocletExperimentService['detectModifiedConditions'](experimentDTO, mockMoocletExperimentRef);

        expect(result).toHaveLength(1);
        expect(result[0].experimentConditionId).toBe('cond-1');
      });

      it('should return null if no conditions modified', () => {
        const experimentDTO = {
          conditions: [{ id: 'cond-1', conditionCode: 'control' }],
        } as ExperimentDTO;

        const result = moocletExperimentService['detectModifiedConditions'](experimentDTO, mockMoocletExperimentRef);

        expect(result).toBeNull();
      });
    });

    describe('#detectExperimentDesignChanges', () => {
      it('should detect multiple changes', () => {
        const experimentDTO = {
          moocletPolicyParameters: { outcome_variable_name: 'new_variable' },
          conditions: [
            { id: 'cond-1', conditionCode: 'modified_control' },
            { id: 'cond-2', conditionCode: 'treatment' },
          ],
        } as any as ExperimentDTO;

        const result = moocletExperimentService['detectExperimentDesignChanges'](
          experimentDTO,
          mockMoocletExperimentRef,
          'old_variable'
        );

        expect(result.newOutcomeVariableName).toBe('new_variable');
        expect(result.addedConditions).toHaveLength(1);
        expect(result.modifiedConditions).toHaveLength(1);
      });

      it('should return null if no changes detected', () => {
        const experimentDTO = {
          moocletPolicyParameters: { outcome_variable_name: 'same_variable' },
          conditions: [{ id: 'cond-1', conditionCode: 'control' }],
        } as any as ExperimentDTO;

        const result = moocletExperimentService['detectExperimentDesignChanges'](
          experimentDTO,
          mockMoocletExperimentRef,
          'same_variable'
        );

        expect(result).toBeNull();
      });
    });
  });

  describe('#handleEditMoocletTransaction', () => {
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.id = 'ref-123';
    mockMoocletExperimentRef.policyParametersId = 1;
    mockMoocletExperimentRef.variableId = 2;
    mockMoocletExperimentRef.versionConditionMaps = [];

    const mockExperiment = {
      id: 'exp-123',
      state: EXPERIMENT_STATE.INACTIVE,
      conditions: [],
      moocletPolicyParameters: mockTSConfigMoocletPolicyParameters,
    } as any as ExperimentDTO;

    const mockCurrentExperiment = {
      id: 'exp-123',
      conditions: [],
    } as any as Experiment;

    const mockCurrentUser = { id: 'user-123' } as any as UserDTO;
    const manager = mockDataSource.manager as EntityManager;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error for ineligible experiment state', async () => {
      const ineligibleExperiment = { ...mockExperiment, state: EXPERIMENT_STATE.CANCELLED };
      const params = { experimentDTO: ineligibleExperiment, currentUser: mockCurrentUser, logger };

      await expect((moocletExperimentService as any).handleEditMoocletTransaction(manager, params)).rejects.toThrow(
        /Ineligible experiment state/
      );
    });

    it('should update experiment without version/variable edits when no changes detected', async () => {
      const params = { experimentDTO: mockExperiment, currentUser: mockCurrentUser, logger };
      const updatedExperiment = { ...mockExperiment };

      jest.spyOn(moocletExperimentService as any, 'fetchCurrentResources').mockResolvedValue({
        currentMoocletExperimentRef: mockMoocletExperimentRef,
        currentOutcomeVariableResponse: { name: mockExperiment.moocletPolicyParameters['outcome_variable_name'] },
        currentPolicyParametersResponse: { parameters: mockExperiment.moocletPolicyParameters },
        currentExperiment: mockCurrentExperiment,
      });

      jest.spyOn(moocletExperimentService as any, 'detectExperimentDesignChanges').mockReturnValue(null);

      const updateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(moocletExperimentService)), 'update');
      updateSpy.mockResolvedValue(updatedExperiment);

      jest.spyOn(moocletExperimentService as any, 'doRevertablePolicyParameterChange').mockResolvedValue({
        parameters: mockExperiment.moocletPolicyParameters,
      });

      const result = await (moocletExperimentService as any).handleEditMoocletTransaction(manager, params);

      expect(result).toEqual(updatedExperiment);
      expect(updateSpy).toHaveBeenCalled();

      updateSpy.mockRestore();
    });

    it('should throw error when version/variable edits attempted on enrolling experiment', async () => {
      const enrollingExperiment = { ...mockExperiment, state: EXPERIMENT_STATE.ENROLLING };
      const params = { experimentDTO: enrollingExperiment, currentUser: mockCurrentUser, logger };

      jest.spyOn(moocletExperimentService as any, 'fetchCurrentResources').mockResolvedValue({
        currentMoocletExperimentRef: mockMoocletExperimentRef,
        currentOutcomeVariableResponse: { name: 'old_variable' },
        currentPolicyParametersResponse: { parameters: mockExperiment.moocletPolicyParameters },
        currentExperiment: mockCurrentExperiment,
      });

      jest.spyOn(moocletExperimentService as any, 'detectExperimentDesignChanges').mockReturnValue({
        newOutcomeVariableName: 'new_variable',
        addedConditions: false,
        removedConditions: false,
        modifiedConditions: false,
      });

      await expect((moocletExperimentService as any).handleEditMoocletTransaction(manager, params)).rejects.toThrow(
        /Ineligible version or variable edits/
      );
    });

    it('should rollback on error', async () => {
      const params = { experimentDTO: mockExperiment, currentUser: mockCurrentUser, logger };
      const mockError = new Error('Update failed');

      jest.spyOn(moocletExperimentService as any, 'fetchCurrentResources').mockRejectedValue(mockError);
      jest.spyOn(moocletExperimentService as any, 'rollbackMoocletEdits').mockResolvedValue(undefined);

      await expect((moocletExperimentService as any).handleEditMoocletTransaction(manager, params)).rejects.toThrow(
        mockError
      );

      expect(moocletExperimentService['rollbackMoocletEdits']).toHaveBeenCalled();
    });
  });

  describe('#rollbackMoocletEdits', () => {
    const mockMoocletExperimentRef = new MoocletExperimentRef();
    mockMoocletExperimentRef.id = 'ref-123';

    const mockCurrentExperiment = {
      id: 'exp-123',
      conditions: [{ id: 'cond-1', conditionCode: 'old_code' }],
    } as any as Experiment;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should rollback policy parameters', async () => {
      const rollbackRef = {
        revertPolicyParameters: mockTSConfigMoocletPolicyParameters,
        revertOutcomeVariableName: null,
        restoreVersions: null,
        revertVersionModifications: null,
        removeVersions: null,
        currentMoocletExperimentRef: mockMoocletExperimentRef,
        currentExperiment: mockCurrentExperiment,
      };

      jest.spyOn(moocletExperimentService as any, 'handleUpdatePolicyParameters').mockResolvedValue({});

      await (moocletExperimentService as any).rollbackMoocletEdits(rollbackRef, logger);

      expect(moocletExperimentService['handleUpdatePolicyParameters']).toHaveBeenCalledWith(
        mockTSConfigMoocletPolicyParameters,
        mockMoocletExperimentRef,
        logger
      );
    });

    it('should rollback outcome variable name', async () => {
      const rollbackRef = {
        revertPolicyParameters: null,
        revertOutcomeVariableName: 'old_variable',
        restoreVersions: null,
        revertVersionModifications: null,
        removeVersions: null,
        currentMoocletExperimentRef: mockMoocletExperimentRef,
        currentExperiment: mockCurrentExperiment,
      };

      jest.spyOn(moocletExperimentService as any, 'handleUpdateOutcomeVariableName').mockResolvedValue({});

      await (moocletExperimentService as any).rollbackMoocletEdits(rollbackRef, logger);

      expect(moocletExperimentService['handleUpdateOutcomeVariableName']).toHaveBeenCalledWith(
        'old_variable',
        mockMoocletExperimentRef,
        logger
      );
    });

    it('should throw error if rollback itself fails', async () => {
      const rollbackRef = {
        revertPolicyParameters: mockTSConfigMoocletPolicyParameters,
        revertOutcomeVariableName: null,
        restoreVersions: null,
        revertVersionModifications: null,
        removeVersions: null,
        currentMoocletExperimentRef: mockMoocletExperimentRef,
        currentExperiment: mockCurrentExperiment,
      };

      const rollbackError = new Error('Rollback failed');
      jest.spyOn(moocletExperimentService as any, 'handleUpdatePolicyParameters').mockRejectedValue(rollbackError);

      await expect((moocletExperimentService as any).rollbackMoocletEdits(rollbackRef, logger)).rejects.toThrow(
        /Error during rollback/
      );
    });
  });
});
