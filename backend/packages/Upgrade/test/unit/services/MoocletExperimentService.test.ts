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
    it('should handle errors and log them', async () => {
      jest.spyOn(moocletDataService, 'deleteMooclet').mockRejectedValue(new Error('Failed to delete mooclet'));
      jest.spyOn(moocletExperimentService as any, 'deleteMoocletVersions').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deletePolicyParameters').mockResolvedValue(undefined);
      jest.spyOn(moocletDataService, 'deleteVariable').mockResolvedValue(undefined);

      await moocletExperimentService.orchestrateDeleteMoocletResources(mockMoocletExperimentRef, logger);

      expect(moocletDataService.deleteMooclet).toHaveBeenCalledWith(mockMoocletExperimentRef.moocletId, logger);
      expect(moocletDataService.deletePolicyParameters).not.toHaveBeenCalled();
      expect(moocletDataService.deleteVariable).not.toHaveBeenCalled();
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
});
