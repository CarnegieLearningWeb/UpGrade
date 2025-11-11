import 'reflect-metadata';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { ExperimentConditionRepository } from '../../../src/api/repositories/ExperimentConditionRepository';
import { DecisionPointRepository } from '../../../src/api/repositories/DecisionPointRepository';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { MonitoredDecisionPointRepository } from '../../../src/api/repositories/MonitoredDecisionPointRepository';
import { ExperimentUserRepository } from '../../../src/api/repositories/ExperimentUserRepository';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { StateTimeLogsRepository } from '../../../src/api/repositories/StateTimeLogsRepository';
import { ExperimentSegmentInclusionRepository } from '../../../src/api/repositories/ExperimentSegmentInclusionRepository';
import { ExperimentSegmentExclusionRepository } from '../../../src/api/repositories/ExperimentSegmentExclusionRepository';
import { SegmentRepository } from '../../../src/api/repositories/SegmentRepository';
import { ConditionPayloadRepository } from '../../../src/api/repositories/ConditionPayloadRepository';
import { FactorRepository } from '../../../src/api/repositories/FactorRepository';
import { LevelRepository } from '../../../src/api/repositories/LevelRepository';
import { LevelCombinationElementRepository } from '../../../src/api/repositories/LevelCombinationElements';
import { ArchivedStatsRepository } from '../../../src/api/repositories/ArchivedStatsRepository';
import { StratificationFactorRepository } from '../../../src/api/repositories/StratificationFactorRepository';
import { MoocletExperimentRefRepository } from '../../../src/api/repositories/MoocletExperimentRefRepository';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { ExperimentSchedulerService } from '../../../src/api/services/ExperimentSchedulerService';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { CacheService } from '../../../src/api/services/CacheService';
import { QueryService } from '../../../src/api/services/QueryService';
import { MetricService } from '../../../src/api/services/MetricService';
import { MoocletRewardsService } from '../../../src/api/services/MoocletRewardsService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';
import { DecisionPoint } from '../../../src/api/models/DecisionPoint';
import { ExperimentDTO } from '../../../src/api/DTO/ExperimentDTO';
import { UserDTO } from '../../../src/api/DTO/UserDTO';
import {
  EXPERIMENT_STATE,
  EXPERIMENT_TYPE,
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  FILTER_MODE,
  LOG_TYPE,
  PAYLOAD_TYPE,
  IMetricMetaData,
} from 'upgrade_types';
import { StateTimeLog } from '../../../src/api/models/StateTimeLogs';
import { Query } from '../../../src/api/models/Query';
import { ConditionPayload } from '../../../src/api/models/ConditionPayload';
import { Segment } from '../../../src/api/models/Segment';

const logger = new UpgradeLogger();

describe('ExperimentService Testing', () => {
  let service: ExperimentService;
  let experimentRepo: ExperimentRepository;
  let conditionRepo: ExperimentConditionRepository;
  let decisionPointRepo: DecisionPointRepository;
  let auditLogRepo: ExperimentAuditLogRepository;
  let conditionPayloadRepo: ConditionPayloadRepository;

  let module: Awaited<ReturnType<TestingModuleBuilder['compile']>>;
  let dataSource: DataSource;
  let entityManager: EntityManager;

  const mockUser: UserDTO = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  } as UserDTO;

  const mockCondition1: Partial<ExperimentCondition> = {
    id: 'condition-1',
    conditionCode: 'control',
    assignmentWeight: 50,
    order: 1,
  };

  const createMockDecisionPoint1 = () => ({
    id: 'partition-1',
    site: 'test-site',
    target: 'test-target',
    order: 1,
    conditionPayloads: [],
  });

  const mockQuery = new Query();
  mockQuery.id = 'id1';
  mockQuery.name = 'query1';
  mockQuery.metric = { key: 'test-metric', type: IMetricMetaData.CONTINUOUS } as any;

  const mockMetric = {
    key: 'test-metric',
    type: 'continuous',
  };

  // Create fresh instances in beforeEach
  let mockDecisionPoint1: Partial<DecisionPoint>;
  let mockConditionPayload: Partial<ConditionPayload>;
  let mockExperiment: Partial<Experiment>;
  let mockExperimentDTO: ExperimentDTO;

  beforeEach(async () => {
    mockDecisionPoint1 = createMockDecisionPoint1();

    mockConditionPayload = {
      id: 'payload-1',
      payloadType: PAYLOAD_TYPE.STRING,
      payloadValue: 'control',
      parentCondition: mockCondition1 as ExperimentCondition,
      decisionPoint: mockDecisionPoint1 as DecisionPoint,
    };

    mockExperiment = {
      id: 'experiment-1',
      name: 'Test Experiment',
      description: 'Test Description',
      state: EXPERIMENT_STATE.INACTIVE,
      type: EXPERIMENT_TYPE.SIMPLE,
      consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
      assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
      postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
      context: ['context1'],
      filterMode: FILTER_MODE.INCLUDE_ALL,
      tags: [],
      conditions: [mockCondition1 as ExperimentCondition],
      partitions: [mockDecisionPoint1 as DecisionPoint],
      conditionPayloads: [mockConditionPayload as ConditionPayload],
      queries: [mockQuery],
      factors: [],
      stateTimeLogs: [],
      experimentSegmentInclusion: [],
      experimentSegmentExclusion: [],
    };

    mockExperimentDTO = {
      id: 'experiment-1',
      name: 'Updated Experiment',
      description: 'Updated Description',
      state: EXPERIMENT_STATE.INACTIVE,
      type: EXPERIMENT_TYPE.SIMPLE,
      consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
      assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
      postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
      context: ['context1'],
      filterMode: FILTER_MODE.INCLUDE_ALL,
      tags: ['tag1'],
      conditions: [
        {
          id: 'condition-1',
          conditionCode: 'control',
          assignmentWeight: 60,
          order: 1,
        } as any,
        {
          id: 'condition-3',
          conditionCode: 'new-treatment',
          assignmentWeight: 40,
          order: 2,
        } as any,
      ],
      partitions: [createMockDecisionPoint1()] as any,
      conditionPayloads: [
        {
          id: 'payload-1',
          parentCondition: 'condition-1',
          decisionPoint: 'partition-1',
          payload: { type: PAYLOAD_TYPE.STRING, value: 'control' },
        } as any,
        {
          id: 'payload-2',
          parentCondition: 'condition-3',
          decisionPoint: 'partition-1',
          payload: { type: PAYLOAD_TYPE.STRING, value: 'new-treatment' },
        } as any,
      ],
      queries: [mockQuery] as any,
      factors: [],
      stateTimeLogs: [],
      experimentSegmentInclusion: [],
      experimentSegmentExclusion: [],
    };

    const queryBuilderMock = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    entityManager = {
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn().mockResolvedValue(mockExperiment),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Experiment) {
          return {
            save: jest.fn().mockResolvedValue(mockExperiment),
            findOne: jest.fn().mockResolvedValue(mockExperiment),
          };
        }
        if (entity === StateTimeLog) {
          return {
            save: jest.fn().mockResolvedValue({}),
          };
        }
        if (entity === ConditionPayload) {
          return {
            find: jest.fn().mockResolvedValue([mockConditionPayload]),
          };
        }
        if (entity === Segment) {
          return {
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          };
        }
        return {
          save: jest.fn().mockResolvedValue({}),
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockResolvedValue([]),
        };
      }),
      createQueryBuilder: jest.fn(() => queryBuilderMock),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    } as any;

    dataSource = {
      manager: {
        transaction: jest.fn().mockImplementation(async (callback) => {
          return callback(entityManager);
        }),
      } as any,
      transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(entityManager);
      }),
      createQueryBuilder: jest.fn(() => queryBuilderMock),
    } as any as DataSource;

    module = await Test.createTestingModule({
      providers: [
        ExperimentService,
        {
          provide: getDataSourceToken('default'),
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(ExperimentRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockExperiment),
            findOneExperiment: jest.fn().mockResolvedValue(mockExperiment),
            save: jest.fn().mockResolvedValue(mockExperiment),
            updateExperiment: jest.fn().mockResolvedValue(mockExperiment),
            updateState: jest.fn().mockResolvedValue([{ state: EXPERIMENT_STATE.ENROLLING }]),
          },
        },
        {
          provide: getRepositoryToken(ExperimentConditionRepository),
          useValue: {
            find: jest.fn().mockResolvedValue([mockCondition1]),
            save: jest.fn().mockResolvedValue(mockCondition1),
            upsertExperimentCondition: jest.fn().mockResolvedValue(mockCondition1),
            deleteCondition: jest.fn().mockResolvedValue({ affected: 1 }),
            getAllUniqueIdentifier: jest.fn().mockResolvedValue(['C1', 'C2']),
          },
        },
        {
          provide: getRepositoryToken(DecisionPointRepository),
          useValue: {
            find: jest.fn().mockResolvedValue([mockDecisionPoint1]),
            save: jest.fn().mockResolvedValue(mockDecisionPoint1),
            findOne: jest.fn().mockResolvedValue(null),
            upsertDecisionPoint: jest.fn().mockResolvedValue(mockDecisionPoint1),
            deleteDecisionPoint: jest.fn().mockResolvedValue({ affected: 1 }),
            deleteByIds: jest.fn().mockResolvedValue({ affected: 1 }),
            getAllUniqueIdentifier: jest.fn().mockResolvedValue(['C1', 'C2']),
          },
        },
        {
          provide: getRepositoryToken(ExperimentAuditLogRepository),
          useValue: {
            saveRawJson: jest.fn().mockResolvedValue({}),
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(ConditionPayloadRepository),
          useValue: {
            find: jest.fn().mockResolvedValue([mockConditionPayload]),
            upsertConditionPayload: jest.fn().mockResolvedValue(mockConditionPayload),
            deleteConditionPayload: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: getRepositoryToken(FactorRepository),
          useValue: {
            insertFactor: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(LevelRepository),
          useValue: {
            insertLevel: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(LevelCombinationElementRepository),
          useValue: {
            insertLevelCombinationElement: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(QueryRepository),
          useValue: {
            upsertQuery: jest.fn().mockResolvedValue(mockQuery),
            deleteQuery: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: getRepositoryToken(StateTimeLogsRepository),
          useValue: {
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(IndividualExclusionRepository),
          useValue: {},
        },
        {
          provide: getRepositoryToken(GroupExclusionRepository),
          useValue: {},
        },
        {
          provide: getRepositoryToken(MonitoredDecisionPointRepository),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ExperimentUserRepository),
          useValue: {},
        },
        {
          provide: getRepositoryToken(MetricRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockMetric),
          },
        },
        {
          provide: getRepositoryToken(ExperimentSegmentInclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(ExperimentSegmentExclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getRepositoryToken(SegmentRepository),
          useValue: {
            deleteSegments: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(ArchivedStatsRepository),
          useValue: {},
        },
        {
          provide: getRepositoryToken(StratificationFactorRepository),
          useValue: {},
        },
        {
          provide: getRepositoryToken(MoocletExperimentRefRepository),
          useValue: {},
        },
        {
          provide: CacheService,
          useValue: {
            delCache: jest.fn().mockResolvedValue(undefined),
            resetPrefixCache: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PreviewUserService,
          useValue: {},
        },
        {
          provide: SegmentService,
          useValue: {
            updateEnrollmentAndExclusionDocuments: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ExperimentSchedulerService,
          useValue: {
            updateExperimentSchedules: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ErrorService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: QueryService,
          useValue: {},
        },
        {
          provide: MetricService,
          useValue: {},
        },
        {
          provide: MoocletRewardsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ExperimentService>(ExperimentService);
    experimentRepo = module.get<ExperimentRepository>(getRepositoryToken(ExperimentRepository));
    conditionRepo = module.get<ExperimentConditionRepository>(getRepositoryToken(ExperimentConditionRepository));
    decisionPointRepo = module.get<DecisionPointRepository>(getRepositoryToken(DecisionPointRepository));
    auditLogRepo = module.get<ExperimentAuditLogRepository>(getRepositoryToken(ExperimentAuditLogRepository));
    conditionPayloadRepo = module.get<ConditionPayloadRepository>(getRepositoryToken(ConditionPayloadRepository));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update()', () => {
    it('should successfully update an experiment with basic changes', async () => {
      const result = await service.update(mockExperimentDTO, mockUser, logger);

      expect(result).toBeDefined();
      expect(auditLogRepo.saveRawJson).toHaveBeenCalledWith(
        LOG_TYPE.EXPERIMENT_UPDATED,
        expect.objectContaining({
          experimentId: mockExperimentDTO.id,
          experimentName: mockExperimentDTO.name,
        }),
        mockUser
      );
    });

    it('should update conditions when they are modified', async () => {
      const result = await service.update(mockExperimentDTO, mockUser, logger);

      expect(result.conditions).toHaveLength(2);
      expect(conditionRepo.upsertExperimentCondition).toHaveBeenCalled();
    });

    it('should update condition payloads', async () => {
      const result = await service.update(mockExperimentDTO, mockUser, logger);

      expect(conditionPayloadRepo.upsertConditionPayload).toHaveBeenCalled();
      expect(result.conditionPayloads).toBeDefined();
    });

    it('should update decision points when they are modified', async () => {
      const updatedExperiment = {
        ...mockExperimentDTO,
        partitions: [
          mockDecisionPoint1,
          {
            id: 'partition-2',
            site: 'new-site',
            target: 'new-target',
            order: 2,
            excludeIfReached: false,
            conditionPayloads: [],
          },
        ] as any,
      };

      const result = await service.update(updatedExperiment as any, mockUser, logger);

      expect(decisionPointRepo.upsertDecisionPoint).toHaveBeenCalled();
      expect(result.partitions).toHaveLength(2);
    });

    it('should delete removed decision points', async () => {
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        partitions: [
          mockDecisionPoint1,
          {
            id: 'partition-2',
            site: 'old-site',
            target: 'old-target',
            conditionPayloads: [],
          },
        ],
      });

      await service.update(mockExperimentDTO, mockUser, logger);

      expect(decisionPointRepo.deleteDecisionPoint).toHaveBeenCalledWith('partition-2', expect.any(Object));
    });

    it('should throw error when experiment is not found', async () => {
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue(null);

      await expect(service.update(mockExperimentDTO, mockUser, logger)).rejects.toThrow();
    });

    it('should throw error when conditionCode is "default"', async () => {
      const experimentWithDefaultCondition = {
        ...mockExperimentDTO,
        conditions: [
          {
            id: 'condition-1',
            conditionCode: 'default',
            assignmentWeight: 100,
            order: 1,
          },
        ] as any,
      };

      await expect(service.update(experimentWithDefaultCondition, mockUser, logger)).rejects.toThrow(
        "'default' as ConditionCode is not allowed."
      );
    });

    it('should log audit entry with correct diff', async () => {
      await service.update(mockExperimentDTO, mockUser, logger);

      expect(auditLogRepo.saveRawJson).toHaveBeenCalledWith(
        LOG_TYPE.EXPERIMENT_UPDATED,
        expect.objectContaining({
          experimentId: mockExperimentDTO.id,
          experimentName: mockExperimentDTO.name,
          diff: expect.any(String),
        }),
        mockUser
      );
    });

    it('should sync conditionPayload values with conditionCode when not customized', async () => {
      const oldExperimentWithPayloads = {
        ...mockExperiment,
        conditions: [
          {
            ...mockCondition1,
            conditionCode: 'original-code',
          },
        ],
        conditionPayloads: [
          {
            id: 'payload-1',
            payloadType: PAYLOAD_TYPE.STRING,
            payloadValue: 'original-code',
            parentCondition: mockCondition1 as ExperimentCondition,
            decisionPoint: mockDecisionPoint1 as DecisionPoint,
          },
        ],
      };

      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue(oldExperimentWithPayloads);

      const updatedExperiment = {
        ...mockExperimentDTO,
        conditions: [
          {
            ...mockCondition1,
            conditionCode: 'new-code',
          },
        ],
        conditionPayloads: [
          {
            id: 'payload-1',
            parentCondition: 'condition-1',
            decisionPoint: 'partition-1',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'original-code' },
          },
        ],
      } as any;

      await service.update(updatedExperiment, mockUser, logger);

      expect(conditionPayloadRepo.upsertConditionPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          payloadValue: 'new-code',
        }),
        entityManager
      );
    });

    it('should preserve custom conditionPayload values when conditionCode changes', async () => {
      const oldExperimentWithCustomPayload = {
        ...mockExperiment,
        conditions: [
          {
            ...mockCondition1,
            conditionCode: 'original-code',
          },
        ],
        conditionPayloads: [
          {
            id: 'payload-1',
            payloadType: PAYLOAD_TYPE.STRING,
            payloadValue: 'custom-value',
            parentCondition: mockCondition1 as ExperimentCondition,
            decisionPoint: mockDecisionPoint1 as DecisionPoint,
          },
        ],
      };

      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue(oldExperimentWithCustomPayload);

      const updatedExperiment = {
        ...mockExperimentDTO,
        conditions: [
          {
            ...mockCondition1,
            conditionCode: 'new-code',
          },
        ],
        conditionPayloads: [
          {
            id: 'payload-1',
            parentCondition: 'condition-1',
            decisionPoint: 'partition-1',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'custom-value' },
          },
        ],
      } as any;

      await service.update(updatedExperiment, mockUser, logger);

      expect(conditionPayloadRepo.upsertConditionPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          payloadValue: 'custom-value',
        }),
        entityManager
      );
    });

    it('should create default payloads for missing condition-partition combinations', async () => {
      const experimentWithNewPartition = {
        ...mockExperimentDTO,
        partitions: [
          mockDecisionPoint1,
          {
            id: 'partition-2',
            site: 'new-site',
            target: 'new-target',
            order: 2,
            excludeIfReached: false,
            conditionPayloads: [],
          },
        ] as any,
        conditionPayloads: [
          {
            id: 'payload-1',
            parentCondition: 'condition-1',
            decisionPoint: 'partition-1',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'control' },
          },
        ] as any,
      };

      await service.update(experimentWithNewPartition, mockUser, logger);

      // Should create payloads for partition-2 with both conditions
      expect(conditionPayloadRepo.upsertConditionPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          parentCondition: 'condition-1',
          decisionPoint: 'partition-2',
          payloadValue: 'control',
        }),
        entityManager
      );
    });
  });
});
