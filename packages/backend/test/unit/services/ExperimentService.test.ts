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
import { ExperimentPrecomputedSegmentService } from '../../../src/api/services/ExperimentPrecomputedSegmentService';
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
  LIST_FILTER_MODE,
  LOG_TYPE,
  PAYLOAD_TYPE,
  IMetricMetaData,
  EXPERIMENT_SEARCH_KEY,
  STANDARD_LIST_TYPE,
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
  let queryRepo: QueryRepository;

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

  const mockCondition3: Partial<ExperimentCondition> = {
    id: 'condition-3',
    conditionCode: 'new-treatment',
    assignmentWeight: 40,
    order: 2,
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
      parentConditionId: mockCondition1.id,
      decisionPoint: mockDecisionPoint1 as DecisionPoint,
      decisionPointId: mockDecisionPoint1.id,
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
          parentCondition: mockCondition1,
          decisionPoint: mockDecisionPoint1,
          payload: { type: PAYLOAD_TYPE.STRING, value: 'control' },
        } as any,
        {
          id: 'payload-2',
          parentCondition: mockCondition3,
          decisionPoint: mockDecisionPoint1,
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
            findBy: jest.fn().mockResolvedValue([mockExperiment]),
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
            findBy: jest.fn().mockResolvedValue([]),
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
            upsertExperimentCondition: jest.fn().mockImplementation((value) => Promise.resolve(value)),
            deleteCondition: jest.fn().mockResolvedValue({ affected: 1 }),
            insertConditions: jest.fn().mockResolvedValue([mockCondition1]),
          },
        },
        {
          provide: getRepositoryToken(DecisionPointRepository),
          useValue: {
            find: jest.fn().mockResolvedValue([mockDecisionPoint1]),
            save: jest.fn().mockResolvedValue(mockDecisionPoint1),
            findOne: jest.fn().mockResolvedValue(null),
            getUsageCountsForExperiment: jest.fn().mockResolvedValue([]),
            upsertDecisionPoint: jest.fn().mockImplementation((value) => Promise.resolve(value)),
            deleteDecisionPoint: jest.fn().mockResolvedValue({ affected: 1 }),
            deleteByIds: jest.fn().mockResolvedValue({ affected: 1 }),
            insertDecisionPoint: jest.fn().mockResolvedValue([mockDecisionPoint1]),
            setAllPendingActivationFalse: jest.fn().mockResolvedValue(undefined),
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
            insertConditionPayload: jest.fn().mockResolvedValue([]),
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
            insertQueries: jest.fn().mockImplementation((docs) => Promise.resolve(docs)),
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
          useValue: {},
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
          provide: ExperimentPrecomputedSegmentService,
          useValue: {
            recomputeForExperiment: jest.fn().mockResolvedValue(undefined),
            scheduleRecomputeForExperiments: jest.fn(),
            scheduleRecomputeForSegment: jest.fn(),
            getAffectedExperimentIds: jest.fn().mockResolvedValue([]),
            getPrecomputedSets: jest.fn().mockResolvedValue(new Map()),
            withRecompute: jest.fn(async (_logger: any, _resolve: any, work: any) => work()),
          },
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
    queryRepo = module.get<QueryRepository>(getRepositoryToken(QueryRepository));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('legacy list type inference', () => {
    it('normalizes an existing standard list type', () => {
      const segment = { listType: 'iNdIvIdUaL' } as Segment;

      expect(service['inferListType'](segment)).toBe(STANDARD_LIST_TYPE.INDIVIDUAL);
    });

    it('infers canonical standard list types', () => {
      const individualList = {
        individualForSegment: [{ userId: 'student-1' }],
        groupForSegment: [],
        subSegments: [],
      } as Segment;
      const segmentList = {
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [{ id: 'segment-1' }],
      } as Segment;

      expect(service['inferListType'](individualList)).toBe(STANDARD_LIST_TYPE.INDIVIDUAL);
      expect(service['inferListType'](segmentList)).toBe(STANDARD_LIST_TYPE.SEGMENT);
    });

    it('preserves context-specific group list types', () => {
      const groupList = {
        listType: 'schoolId',
      } as Segment;

      expect(service['inferListType'](groupList)).toBe('schoolId');
    });
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

    it('should include current decision point usage counts in the updated experiment response', async () => {
      decisionPointRepo.getUsageCountsForExperiment = jest
        .fn()
        .mockResolvedValue([{ decisionPointId: mockDecisionPoint1.id, usedByCount: 2 }]);

      const result = await service.update(mockExperimentDTO, mockUser, logger);

      expect(decisionPointRepo.getUsageCountsForExperiment).toHaveBeenCalledWith(mockExperimentDTO.id, undefined);
      expect(result.partitions).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: mockDecisionPoint1.id, usedByCount: 2 })])
      );
    });

    it('should update conditions when they are modified', async () => {
      const result = await service.update(mockExperimentDTO, mockUser, logger);

      expect(result.conditions).toHaveLength(2);
      expect(conditionRepo.upsertExperimentCondition).toHaveBeenCalled();
    });

    it('recomputes the precomputed segment row (to empty) after a context change', async () => {
      const precomputed = module.get<ExperimentPrecomputedSegmentService>(ExperimentPrecomputedSegmentService);
      (precomputed.scheduleRecomputeForExperiments as jest.Mock).mockClear();

      // The stored experiment is on 'context1' (see mockExperiment). Moving it to 'context2' deletes all
      // segment lists and forces EXCLUDE_ALL, so the experiment_precomputed_segment row must be
      // recomputed (to empty) after commit — otherwise it keeps stale inclusion/exclusion IDs.
      const contextChangeDTO = { ...mockExperimentDTO, context: ['context2'] } as any;
      await service.update(contextChangeDTO, mockUser, logger);

      expect(precomputed.scheduleRecomputeForExperiments).toHaveBeenCalledWith([mockExperimentDTO.id], logger);
    });

    it('does not recompute the precomputed segment row on a normal (same-context) update', async () => {
      const precomputed = module.get<ExperimentPrecomputedSegmentService>(ExperimentPrecomputedSegmentService);
      (precomputed.scheduleRecomputeForExperiments as jest.Mock).mockClear();

      await service.update(mockExperimentDTO, mockUser, logger);

      expect(precomputed.scheduleRecomputeForExperiments).not.toHaveBeenCalled();
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

    it('should assign order to queries based on their position when updating', async () => {
      const q1 = { ...mockQuery, id: 'q1', name: 'query-1' };
      const q2 = { ...mockQuery, id: 'q2', name: 'query-2' };
      const experimentWithQueries = { ...mockExperimentDTO, queries: [q1, q2] as any };

      await service.update(experimentWithQueries, mockUser, logger);

      const upsertCalls = (queryRepo.upsertQuery as jest.Mock).mock.calls;
      const savedQueries = upsertCalls.map((call) => call[0]);
      expect(savedQueries.find((q) => q.name === 'query-1').order).toBe(1);
      expect(savedQueries.find((q) => q.name === 'query-2').order).toBe(2);
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
          parentConditionId: 'condition-1',
          decisionPointId: 'partition-2',
          payloadValue: 'control',
        }),
        entityManager
      );
    });

    it('should preserve pendingActivation: false for an existing decision point during update', async () => {
      const existingDp = { ...createMockDecisionPoint1(), pendingActivation: false };
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        partitions: [existingDp],
      });

      await service.update(mockExperimentDTO, mockUser, logger);

      expect(decisionPointRepo.upsertDecisionPoint).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'partition-1', pendingActivation: false }),
        expect.any(Object)
      );
    });

    it('should set pendingActivation: true for a new decision point added during update', async () => {
      const existingDp = { ...createMockDecisionPoint1(), pendingActivation: false };
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        partitions: [existingDp],
      });

      const updatedExperiment = {
        ...mockExperimentDTO,
        partitions: [
          createMockDecisionPoint1(),
          {
            id: 'partition-new',
            site: 'new-site',
            target: 'new-target',
            order: 2,
            excludeIfReached: false,
            conditionPayloads: [],
          },
        ] as any,
      };

      await service.update(updatedExperiment as any, mockUser, logger);

      expect(decisionPointRepo.upsertDecisionPoint).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'partition-new', pendingActivation: true }),
        expect.any(Object)
      );
    });

    it('should throw BadRequestError when removing an active decision point from an ENROLLING experiment', async () => {
      const activeDp = { ...createMockDecisionPoint1(), pendingActivation: false };
      const dpToRemove = {
        id: 'partition-2',
        site: 'site-to-remove',
        target: 'target-to-remove',
        pendingActivation: false,
        conditionPayloads: [],
      };
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        state: EXPERIMENT_STATE.ENROLLING,
        partitions: [activeDp, dpToRemove],
      });

      const updatedExperiment = {
        ...mockExperimentDTO,
        partitions: [createMockDecisionPoint1()] as any,
      };

      await expect(service.update(updatedExperiment as any, mockUser, logger)).rejects.toThrow(
        'Cannot remove decision point'
      );
    });

    it('should throw BadRequestError when removing an active decision point from an ENROLLMENT_COMPLETE experiment', async () => {
      const activeDp = { ...createMockDecisionPoint1(), pendingActivation: false };
      const dpToRemove = {
        id: 'partition-2',
        site: 'site-to-remove',
        target: 'target-to-remove',
        pendingActivation: false,
        conditionPayloads: [],
      };
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
        partitions: [activeDp, dpToRemove],
      });

      const updatedExperiment = {
        ...mockExperimentDTO,
        partitions: [createMockDecisionPoint1()] as any,
      };

      await expect(service.update(updatedExperiment as any, mockUser, logger)).rejects.toThrow(
        'Cannot remove decision point'
      );
    });

    it('should allow removing a pending decision point from an ENROLLING experiment', async () => {
      const activeDp = { ...createMockDecisionPoint1(), pendingActivation: false };
      const pendingDp = {
        id: 'partition-2',
        site: 'pending-site',
        target: 'pending-target',
        pendingActivation: true,
        conditionPayloads: [],
      };
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        state: EXPERIMENT_STATE.ENROLLING,
        partitions: [activeDp, pendingDp],
      });

      const updatedExperiment = {
        ...mockExperimentDTO,
        partitions: [createMockDecisionPoint1()] as any,
      };

      const result = await service.update(updatedExperiment as any, mockUser, logger);
      expect(result).toBeDefined();
    });

    it('should allow removing a decision point from an INACTIVE experiment', async () => {
      const dp1 = { ...createMockDecisionPoint1(), pendingActivation: false };
      const dp2 = {
        id: 'partition-2',
        site: 'other-site',
        target: 'other-target',
        pendingActivation: false,
        conditionPayloads: [],
      };
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        state: EXPERIMENT_STATE.INACTIVE,
        partitions: [dp1, dp2],
      });

      const updatedExperiment = {
        ...mockExperimentDTO,
        partitions: [createMockDecisionPoint1()] as any,
      };

      const result = await service.update(updatedExperiment as any, mockUser, logger);
      expect(result).toBeDefined();
    });
  });

  describe('create()', () => {
    const baseCreateDTO = (): ExperimentDTO =>
      ({
        id: undefined,
        name: 'New Experiment',
        description: '',
        state: EXPERIMENT_STATE.INACTIVE,
        type: EXPERIMENT_TYPE.SIMPLE,
        consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
        assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
        postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
        context: ['context1'],
        filterMode: FILTER_MODE.INCLUDE_ALL,
        tags: [],
        conditions: [{ id: 'condition-1', conditionCode: 'control', assignmentWeight: 100 }] as any,
        partitions: [{ id: 'partition-1', site: 'site', target: 'target' }] as any,
        conditionPayloads: [],
        queries: [],
        factors: [],
        stateTimeLogs: [],
        experimentSegmentInclusion: [],
        experimentSegmentExclusion: [],
      } as any);

    it('awaits exclusion-list attachment before returning, even with no inclusion lists, under a caller-owned transaction', async () => {
      // Regression: the only `await Promise.all(addListPromises)` used to sit inside the inclusion-list
      // branch, so an exclusion-only experiment created within a caller-owned transaction
      // (existingEntityManager, e.g. MoocletExperimentService) returned with its addList insert still in
      // flight — racing the caller's commit. create() must now await it unconditionally.
      let resolveAddList: () => void;
      const addListPending = new Promise<any>((res) => {
        resolveAddList = () => res({});
      });
      jest.spyOn(service, 'addList').mockReturnValue(addListPending);

      const dto = {
        ...baseCreateDTO(),
        experimentSegmentInclusion: [],
        experimentSegmentExclusion: [{ segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } }],
      } as any;

      let resolved = false;
      const createPromise = service
        .create(dto, mockUser, logger, { existingEntityManager: dataSource.manager })
        .then((r) => {
          resolved = true;
          return r;
        });

      // Flush pending macrotasks; create() must still be pending on the exclusion addList.
      await new Promise((r) => setImmediate(r));
      expect(service.addList).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        LIST_FILTER_MODE.EXCLUSION,
        mockUser,
        logger,
        dataSource.manager
      );
      expect(resolved).toBe(false);

      // Once the exclusion insert settles, create() resolves.
      resolveAddList();
      await createPromise;
      expect(resolved).toBe(true);
    });

    it('should assign order to queries starting from 1 on create', async () => {
      const q1 = { ...mockQuery, id: 'q1', name: 'query-1', metric: { key: 'test-metric' } };
      const dto = { ...baseCreateDTO(), queries: [q1] as any };

      await service.create(dto, mockUser, logger);

      const insertedDocs: any[] = (queryRepo.insertQueries as jest.Mock).mock.calls[0][0];
      expect(insertedDocs[0].order).toBe(1);
    });

    it('should assign sequential order to multiple queries on create', async () => {
      const q1 = { ...mockQuery, id: 'q1', name: 'query-1', metric: { key: 'test-metric' } };
      const q2 = { ...mockQuery, id: 'q2', name: 'query-2', metric: { key: 'test-metric' } };
      const q3 = { ...mockQuery, id: 'q3', name: 'query-3', metric: { key: 'test-metric' } };
      const dto = { ...baseCreateDTO(), queries: [q1, q2, q3] as any };

      await service.create(dto, mockUser, logger);

      const insertedDocs: any[] = (queryRepo.insertQueries as jest.Mock).mock.calls[0][0];
      expect(insertedDocs[0].order).toBe(1);
      expect(insertedDocs[1].order).toBe(2);
      expect(insertedDocs[2].order).toBe(3);
    });

    it('should overwrite any pre-existing order value on create', async () => {
      const q1 = { ...mockQuery, id: 'q1', name: 'query-1', metric: { key: 'test-metric' }, order: 99 };
      const dto = { ...baseCreateDTO(), queries: [q1] as any };

      await service.create(dto, mockUser, logger);

      const insertedDocs: any[] = (queryRepo.insertQueries as jest.Mock).mock.calls[0][0];
      expect(insertedDocs[0].order).toBe(1);
    });

    it('should not call insertQueries when experiment has no queries', async () => {
      const dto = { ...baseCreateDTO(), queries: [] };

      await service.create(dto, mockUser, logger);

      expect(queryRepo.insertQueries).not.toHaveBeenCalled();
    });

    it('should set pendingActivation to true on new decision points for INACTIVE experiments', async () => {
      const dto = baseCreateDTO();

      await service.create(dto, mockUser, logger);

      expect(decisionPointRepo.insertDecisionPoint).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ pendingActivation: true })]),
        expect.any(Object)
      );
    });

    it('should set pendingActivation to false on decision points when experiment starts in ENROLLING state', async () => {
      const dto = { ...baseCreateDTO(), state: EXPERIMENT_STATE.ENROLLING };

      await service.create(dto, mockUser, logger);

      expect(decisionPointRepo.insertDecisionPoint).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ pendingActivation: false })]),
        expect.any(Object)
      );
    });

    it('should set pendingActivation to false on decision points when experiment starts in RUNNING state', async () => {
      const dto = { ...baseCreateDTO(), state: EXPERIMENT_STATE.RUNNING };

      await service.create(dto, mockUser, logger);

      expect(decisionPointRepo.insertDecisionPoint).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ pendingActivation: false })]),
        expect.any(Object)
      );
    });
  });

  describe('updateState()', () => {
    it('should call setAllPendingActivationFalse when transitioning to ENROLLING', async () => {
      experimentRepo.findOneExperiment = jest.fn().mockResolvedValue({
        ...mockExperiment,
        state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
      });
      experimentRepo.updateState = jest.fn().mockResolvedValue([{ state: EXPERIMENT_STATE.ENROLLING }]);

      await service.updateState(mockExperiment.id, EXPERIMENT_STATE.ENROLLING, mockUser, logger);

      expect(decisionPointRepo.setAllPendingActivationFalse).toHaveBeenCalledWith(mockExperiment.id, undefined);
    });

    it('should not call setAllPendingActivationFalse when transitioning to PAUSED', async () => {
      experimentRepo.updateState = jest.fn().mockResolvedValue([{ state: EXPERIMENT_STATE.PAUSED }]);

      await service.updateState(mockExperiment.id, EXPERIMENT_STATE.PAUSED, mockUser, logger);

      expect(decisionPointRepo.setAllPendingActivationFalse).not.toHaveBeenCalled();
    });

    it('should not call setAllPendingActivationFalse when transitioning to INACTIVE', async () => {
      experimentRepo.updateState = jest.fn().mockResolvedValue([{ state: EXPERIMENT_STATE.INACTIVE }]);

      await service.updateState(mockExperiment.id, EXPERIMENT_STATE.INACTIVE, mockUser, logger);

      expect(decisionPointRepo.setAllPendingActivationFalse).not.toHaveBeenCalled();
    });

    it('should include current decision point usage counts in the updated state response', async () => {
      decisionPointRepo.getUsageCountsForExperiment = jest
        .fn()
        .mockResolvedValue([{ decisionPointId: mockDecisionPoint1.id, usedByCount: 2 }]);

      const result = await service.updateState(
        mockExperiment.id,
        EXPERIMENT_STATE.PAUSED,
        mockUser,
        logger,
        undefined,
        entityManager
      );

      expect(decisionPointRepo.getUsageCountsForExperiment).toHaveBeenCalledWith(mockExperiment.id, entityManager);
      expect(result.partitions).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: mockDecisionPoint1.id, usedByCount: 2 })])
      );
    });
  });

  describe('getSingleExperiment()', () => {
    it('should attach decision point usage counts to the single experiment response', async () => {
      const secondDecisionPoint = {
        ...createMockDecisionPoint1(),
        id: 'partition-2',
        site: 'another-site',
      } as DecisionPoint;
      const experiment = {
        ...mockExperiment,
        partitions: [mockDecisionPoint1 as DecisionPoint, secondDecisionPoint],
      } as Experiment;

      jest.spyOn(service, 'findOne').mockResolvedValue(experiment);
      decisionPointRepo.getUsageCountsForExperiment = jest
        .fn()
        .mockResolvedValue([{ decisionPointId: mockDecisionPoint1.id, usedByCount: 2 }]);

      const result = await service.getSingleExperiment(mockExperiment.id);

      expect(decisionPointRepo.getUsageCountsForExperiment).toHaveBeenCalledWith(mockExperiment.id);
      expect(result.partitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: mockDecisionPoint1.id, usedByCount: 2 }),
          expect.objectContaining({ id: secondDecisionPoint.id, usedByCount: 0 }),
        ])
      );
    });
  });

  describe('paginatedSearchString()', () => {
    const getSearchClause = (key: EXPERIMENT_SEARCH_KEY, searchString: string): string =>
      service['paginatedSearchString']({ key, string: searchString });

    it('should search decision points by site, target, and displayed site-target pair', () => {
      const searchString = 'SelectSection (absolute_value_plot_equality)';
      const escapedSearchString = 'SelectSection (absolute\\_value\\_plot\\_equality)';
      const likeClause = `ILIKE '%${escapedSearchString}%' ESCAPE '\\'`;
      const result = getSearchClause(EXPERIMENT_SEARCH_KEY.DECISION_POINT, searchString);

      expect(result).toContain(`partitions.site ${likeClause}`);
      expect(result).toContain(`partitions.target ${likeClause}`);
      expect(result).toContain(
        `(CASE WHEN COALESCE(partitions.target, '') = '' THEN partitions.site ` +
          `ELSE CONCAT(partitions.site, ' (', partitions.target, ')') END) ${likeClause}`
      );
    });

    it('should use site as the decision point display value when target is empty', () => {
      const likeClause = `ILIKE '%SelectSection%' ESCAPE '\\'`;
      const result = getSearchClause(EXPERIMENT_SEARCH_KEY.DECISION_POINT, 'SelectSection');

      expect(result).toContain(`COALESCE(partitions.target, '') = '' THEN partitions.site`);
      expect(result).toContain(`partitions.site ${likeClause}`);
    });

    it('should include displayed decision point search in all-search results', () => {
      const searchString = 'SelectSection (absolute_value_plot_equality)';
      const escapedSearchString = 'SelectSection (absolute\\_value\\_plot\\_equality)';
      const likeClause = `ILIKE '%${escapedSearchString}%' ESCAPE '\\'`;
      const result = getSearchClause(EXPERIMENT_SEARCH_KEY.ALL, searchString);

      expect(result).toContain(`partitions.site ${likeClause}`);
      expect(result).toContain(`partitions.target ${likeClause}`);
      expect(result).toContain(
        `(CASE WHEN COALESCE(partitions.target, '') = '' THEN partitions.site ` +
          `ELSE CONCAT(partitions.site, ' (', partitions.target, ')') END) ${likeClause}`
      );
    });

    it('should escape LIKE wildcards and the escape character in search input', () => {
      const result = getSearchClause(EXPERIMENT_SEARCH_KEY.NAME, '100%_path\\name');

      expect(result).toContain(`name ILIKE '%100\\%\\_path\\\\name%' ESCAPE '\\'`);
    });
  });

  describe('formattingConditionPayload()', () => {
    // The assignment read path calls this on experiments handed out by the in-memory cache, which
    // returns the same object reference to every request. Mutating the input would corrupt the cached
    // graph for every subsequent request — which is exactly why this call site used to need a full
    // deep copy of the experiment per request. These tests guard the invariant that removed it.
    const buildSimpleExperiment = (): Experiment => {
      const conditionA = { id: 'condition-a', order: 1 } as ExperimentCondition;
      const conditionB = { id: 'condition-b', order: 2 } as ExperimentCondition;
      const decisionPoint = { id: 'dp-1', site: 'SelectSection', target: 'target-1' } as DecisionPoint;

      // Deliberately out of order so the sort inside the formatter has something to do.
      decisionPoint.conditionPayloads = [
        { id: 'payload-b', parentCondition: conditionB } as ConditionPayload,
        { id: 'payload-a', parentCondition: conditionA } as ConditionPayload,
      ];

      return {
        id: 'experiment-1',
        type: EXPERIMENT_TYPE.SIMPLE,
        conditions: [conditionA, conditionB],
        partitions: [decisionPoint],
      } as Experiment;
    };

    const buildFactorialExperiment = (): Experiment => {
      const condition = { id: 'condition-a', order: 1 } as ExperimentCondition;
      condition.conditionPayloads = [{ id: 'payload-a' } as ConditionPayload];

      return {
        id: 'experiment-2',
        type: EXPERIMENT_TYPE.FACTORIAL,
        conditions: [condition],
        partitions: [],
      } as Experiment;
    };

    it('should not mutate the input experiment for a simple experiment', () => {
      const experiment = buildSimpleExperiment();
      const snapshot = JSON.parse(JSON.stringify(experiment));

      service.formattingConditionPayload(experiment);

      expect(JSON.parse(JSON.stringify(experiment))).toEqual(snapshot);
      expect(experiment.partitions[0].conditionPayloads).toHaveLength(2);
    });

    it('should not mutate the input experiment for a factorial experiment', () => {
      const experiment = buildFactorialExperiment();
      const snapshot = JSON.parse(JSON.stringify(experiment));

      service.formattingConditionPayload(experiment);

      expect(JSON.parse(JSON.stringify(experiment))).toEqual(snapshot);
      expect(experiment.conditions[0].conditionPayloads).toHaveLength(1);
    });

    it('should hoist payloads to the root, strip them from decision points, and sort by condition order', () => {
      const result = service.formattingConditionPayload(buildSimpleExperiment());

      expect(result.conditionPayloads.map((payload) => payload.id)).toEqual(['payload-a', 'payload-b']);
      expect(result.partitions[0].conditionPayloads).toBeUndefined();
      // decisionPoint back-references must point at the stripped partition on the returned experiment
      expect(result.conditionPayloads[0].decisionPoint).toBe(result.partitions[0]);
    });

    it('should hoist payloads to the root and strip them from conditions for a factorial experiment', () => {
      const result = service.formattingConditionPayload(buildFactorialExperiment());

      expect(result.conditionPayloads.map((payload) => payload.id)).toEqual(['payload-a']);
      expect(result.conditions[0].conditionPayloads).toBeUndefined();
      // parentCondition back-references must point at the stripped condition on the returned experiment
      expect(result.conditionPayloads[0].parentCondition).toBe(result.conditions[0]);
    });

    it('should leave repeated formatting of the same cached experiment stable', () => {
      const experiment = buildSimpleExperiment();

      const first = service.formattingConditionPayload(experiment);
      const second = service.formattingConditionPayload(experiment);

      expect(second.conditionPayloads.map((payload) => payload.id)).toEqual(
        first.conditionPayloads.map((payload) => payload.id)
      );
    });
  });
});
