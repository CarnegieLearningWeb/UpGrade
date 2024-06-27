import { SegmentService } from '../../../src/api/services/SegmentService';
import * as sinon from 'sinon';
import { Connection, ConnectionManager } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SegmentRepository } from '../../../src/api/repositories/SegmentRepository';
import { Segment } from '../../../src/api/models/Segment';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { IndividualForSegmentRepository } from '../../../src/api/repositories/IndividualForSegmentRepository';
import { GroupForSegmentRepository } from '../../../src/api/repositories/GroupForSegmentRepository';
import { ExperimentSegmentExclusionRepository } from '../../../src/api/repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../../../src/api/repositories/ExperimentSegmentInclusionRepository';
import { CacheService } from '../../../src/api/services/CacheService';
import { SegmentFile, SegmentInputValidator } from '../../../src/api/controllers/validators/SegmentInputValidator';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';
import { GroupForSegment } from '../../../src/api/models/GroupForSegment';
import { Experiment } from '../../../src/api/models/Experiment';
import { SEGMENT_TYPE, SERVER_ERROR, EXPERIMENT_STATE } from 'upgrade_types';

const exp = new Experiment();
const seg2 = new Segment();
const seg1 = new Segment();
const segValSegment = new Segment();
const logger = new UpgradeLogger();
const segmentArr = [seg1, seg2];
const segVal = new SegmentInputValidator();
const include = [{ segment: seg1, experiment: exp }];
const segValImportFile: SegmentFile = {
  fileName: 'seg1.json',
  fileContent: '',
};

describe('Segment Service Testing', () => {
  let service: SegmentService;
  let repo: SegmentRepository;
  let module: TestingModule;

  const queryBuilderMock = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(segmentArr),
    getOne: jest.fn().mockResolvedValue(seg1),
    getAllSegments: jest.fn().mockResolvedValue(segmentArr),
    delete: jest.fn().mockReturnThis(),
  };

  const sandbox = sinon.createSandbox();

  const entityManagerMock = { createQueryBuilder: () => queryBuilderMock, getRepository: () => repo };
  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    transaction: jest.fn(async (passedFunction) => await passedFunction(entityManagerMock)),
  } as unknown as Connection);

  beforeEach(async () => {
    exp.id = 'exp1';
    exp.state = EXPERIMENT_STATE.ENROLLING;
    seg2.subSegments = [];
    seg2.id = 'seg2';
    seg2.subSegments = [];
    seg2.context = 'add';
    seg1.subSegments = [];
    seg1.id = 'seg1';
    seg1.subSegments = [seg2];
    seg1.context = 'add';
    const user = new IndividualForSegment();
    user.userId = 'user1';
    seg1.individualForSegment = [user];
    const group = new GroupForSegment();
    group.groupId = 'group1';
    group.type = 'type';
    seg1.groupForSegment = [group];
    segVal.context = 'add';
    segVal.id = 'c6d3fe3b-4ad2-4949-bd05-5a7a2481d32f';
    segVal.name = 'seg3';
    segVal.subSegmentIds = ['seg1', 'seg2'];
    segVal.userIds = ['user1', 'user2', 'user3'];
    segVal.groups = [{ groupId: 'group1', type: 'add-group1' }];
    segValSegment.id = 'segval1';
    segValSegment.subSegments = [seg1, seg2];
    const group1 = new GroupForSegment();
    group1.groupId = 'group1';
    group1.type = 'add-group1';
    segValSegment.groupForSegment = [group1];
    const user2 = new IndividualForSegment();
    user2.userId = 'user2';
    const user3 = new IndividualForSegment();
    user3.userId = 'user3';
    segValSegment.individualForSegment = [user, user2, user3];
    const segValUserIds = segVal.userIds.map((userId) => {
      return { userId: userId };
    });
    const segValSubSegmentIds = segVal.subSegmentIds.map((segmentId) => {
      return { id: segmentId };
    });
    const segValImport = {
      ...segVal,
      individualForSegment: segValUserIds,
      groupForSegment: segVal.groups,
      subSegments: segValSubSegmentIds,
      name: 'seg4',
      context: 'add',
      description: '',
      type: SEGMENT_TYPE.PUBLIC,
    };
    segValImportFile.fileContent = JSON.stringify(segValImport);

    module = await Test.createTestingModule({
      providers: [
        SegmentService,
        IndividualForSegmentRepository,
        GroupForSegmentRepository,
        ExperimentSegmentExclusionRepository,
        ExperimentSegmentInclusionRepository,
        CacheService,
        SegmentRepository,
        {
          provide: getRepositoryToken(SegmentRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            find: jest.fn().mockResolvedValue(segmentArr),
            delete: jest.fn(),
            getAllSegments: jest.fn().mockResolvedValue(segmentArr),
            deleteSegment: jest.fn().mockImplementation((seg) => {
              return seg;
            }),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(segmentArr),
              getOne: jest.fn().mockResolvedValue(seg1),
            })),
          },
        },
        {
          provide: getRepositoryToken(ExperimentSegmentExclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            delete: jest.fn(),
            getExperimentSegmentExclusionData: jest.fn().mockResolvedValue(include),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(segmentArr),
            })),
          },
        },
        {
          provide: getRepositoryToken(ExperimentSegmentInclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            delete: jest.fn(),
            getExperimentSegmentInclusionData: jest.fn().mockResolvedValue(include),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(segmentArr),
            })),
          },
        },
        {
          provide: getRepositoryToken(IndividualForSegmentRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            insertIndividualForSegment: jest.fn().mockResolvedValue(segmentArr),
            getExperimentSegmentExclusionData: jest.fn().mockResolvedValue(include),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(segmentArr),
            })),
          },
        },
        {
          provide: getRepositoryToken(GroupForSegmentRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            insertGroupForSegment: jest.fn().mockResolvedValue(segmentArr),
            getExperimentSegmentExclusionData: jest.fn().mockResolvedValue(include),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(segmentArr),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<SegmentService>(SegmentService);
    repo = module.get<SegmentRepository>(getRepositoryToken(SegmentRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(segmentArr);
  });

  it('should return all segments', async () => {
    const segments = await service.getAllSegments(logger);
    expect(segments).toEqual(segmentArr);
  });

  it('should get segment by id', async () => {
    const segments = await service.getSegmentById(seg1.id, logger);
    expect(segments).toEqual(seg1);
  });

  it('should get segments by ids', async () => {
    const segments = await service.getSegmentByIds([seg1.id]);
    expect(segments).toEqual([seg1]);
  });

  it('should return all segments with status for enrolling experiments', async () => {
    const res = {
      segmentsData: [
        {
          id: seg1.id,
          context: 'add',
          status: 'Used',
          subSegments: seg1.subSegments,
          groupForSegment: seg1.groupForSegment,
          individualForSegment: seg1.individualForSegment,
        },
        { id: seg2.id, context: 'add', status: 'Used', subSegments: seg2.subSegments },
      ],
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
    };
    const segments = await service.getAllSegmentWithStatus(logger);
    expect(segments).toEqual(res);
  });

  it('should return all segments with status for not enrolling experiments', async () => {
    exp.state = EXPERIMENT_STATE.ENROLLMENT_COMPLETE;
    const res = {
      segmentsData: [
        {
          id: seg1.id,
          context: 'add',
          status: 'Used',
          subSegments: seg1.subSegments,
          groupForSegment: seg1.groupForSegment,
          individualForSegment: seg1.individualForSegment,
        },
        { id: seg2.id, context: 'add', status: 'Used', subSegments: seg2.subSegments },
      ],
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
    };
    const segments = await service.getAllSegmentWithStatus(logger);
    expect(segments).toEqual(res);
  });

  it('should return single segments with status', async () => {
    const res = {
      id: seg1.id,
      context: 'add',
      status: 'Used',
      subSegments: seg1.subSegments,
      groupForSegment: seg1.groupForSegment,
      individualForSegment: seg1.individualForSegment,
    };
    const segment = await service.getSingleSegmentWithStatus(seg1.id, logger);
    expect(segment).toEqual(res);
  });

  it('should return all segments with status with global segment', async () => {
    seg1.id = '77777777-7777-7777-7777-777777777777';
    const res = {
      segmentsData: [
        {
          id: seg1.id,
          context: 'add',
          status: 'Global',
          subSegments: seg1.subSegments,
          groupForSegment: seg1.groupForSegment,
          individualForSegment: seg1.individualForSegment,
        },
        { id: seg2.id, context: 'add', status: 'Used', subSegments: seg2.subSegments },
      ],
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
    };
    const segments = await service.getAllSegmentWithStatus(logger);
    expect(segments).toEqual(res);
  });

  it('should return segment exclusion data', async () => {
    const segments = await service.getExperimentSegmentExclusionData();
    expect(segments).toEqual(include);
  });

  it('should return segment inclusion data', async () => {
    const segments = await service.getExperimentSegmentInclusionData();
    expect(segments).toEqual(include);
  });

  it('should upsert a segment', async () => {
    const segments = await service.upsertSegment(segVal, logger);
    expect(segments).toEqual(seg1);
  });

  it('should upsert a segment with no id', async () => {
    const err = new Error('error');
    const segment = new SegmentInputValidator();
    segment.subSegmentIds = ['seg1'];
    segment.userIds = [];
    segment.groups = [];
    repo.findOne = jest.fn().mockResolvedValue(seg2);
    const indivRepo = module.get<IndividualForSegmentRepository>(getRepositoryToken(IndividualForSegmentRepository));
    indivRepo.insertIndividualForSegment = jest.fn().mockImplementation(() => {
      throw err;
    });
    expect(async () => {
      await service.upsertSegment(segment, logger);
    }).rejects.toThrow(new Error('Error in creating individualDocs, groupDocs in "addSegmentInDB"'));
  });

  it('should throw an error when unable to delete segment', async () => {
    const err = new Error('error');
    repo.delete = jest.fn().mockImplementation(() => {
      throw err;
    });
    expect(async () => {
      await service.upsertSegment(segVal, logger);
    }).rejects.toThrow(err);
  });

  it('should throw an error when unable to save segment', async () => {
    const err = new Error('error');
    repo.save = jest.fn().mockImplementation(() => {
      throw err;
    });
    expect(async () => {
      await service.upsertSegment(segVal, logger);
    }).rejects.toThrow(err);
  });

  it('should delete a segment', async () => {
    const segments = await service.deleteSegment(seg1.id, logger);
    expect(segments).toEqual(seg1.id);
  });

  it('should import a segment', async () => {
    const returnSegment = [
      {
        fileName: 'seg1',
        error: null,
      },
    ];
    service.getSegmentByIds = jest.fn().mockResolvedValue([seg1, seg2]);
    repo.find = jest.fn().mockResolvedValue([]);
    service.addSegmentDataInDB = jest.fn().mockResolvedValue(segValSegment);
    const segments = await service.importSegments([segValImportFile], logger);
    expect(segments).toEqual(returnSegment);
  });

  it('should throw an error when trying to import a segment that includes an unknown subsegment', async () => {
    const returnSegment = [
      {
        fileName: 'seg1',
        error:
          'Invalid Segment data: ' +
          'SubSegment: seg2 not found. Please import subSegment with same context and link in segment. ',
      },
    ];
    service.getSegmentByIds = jest.fn().mockResolvedValue([seg1]);
    repo.find = jest.fn().mockResolvedValue([]);
    const segments = await service.importSegments([segValImportFile], logger);
    expect(segments).toEqual(returnSegment);
  });

  it('should export a segment', async () => {
    const segments = await service.exportSegments([seg1.id], logger);
    expect(segments).toEqual([seg1]);
  });

  it('should throw an error when segment not found on export', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);
    expect(async () => {
      await service.exportSegments([seg1.id], logger);
    }).rejects.toThrow(new Error(SERVER_ERROR.QUERY_FAILED));
  });
});
