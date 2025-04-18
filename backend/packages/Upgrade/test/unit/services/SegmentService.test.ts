import { SegmentService } from '../../../src/api/services/SegmentService';
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { SegmentRepository } from '../../../src/api/repositories/SegmentRepository';
import { Segment } from '../../../src/api/models/Segment';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { IndividualForSegmentRepository } from '../../../src/api/repositories/IndividualForSegmentRepository';
import { GroupForSegmentRepository } from '../../../src/api/repositories/GroupForSegmentRepository';
import { ExperimentSegmentExclusionRepository } from '../../../src/api/repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../../../src/api/repositories/ExperimentSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentExclusionRepository';
import { FeatureFlagSegmentInclusionRepository } from '../../../src/api/repositories/FeatureFlagSegmentInclusionRepository';
import { CacheService } from '../../../src/api/services/CacheService';
import {
  ListInputValidator,
  SegmentFile,
  SegmentInputValidator,
} from '../../../src/api/controllers/validators/SegmentInputValidator';
import {
  SEGMENT_SEARCH_KEY,
  SEGMENT_SORT_KEY,
} from '../../../src/api/controllers/validators/SegmentPaginatedParamsValidator';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';
import { GroupForSegment } from '../../../src/api/models/GroupForSegment';
import { Experiment } from '../../../src/api/models/Experiment';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import {
  SEGMENT_TYPE,
  SERVER_ERROR,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  IMPORT_COMPATIBILITY_TYPE,
  SORT_AS_DIRECTION,
} from 'upgrade_types';
import { configureLogger } from '../../utils/logger';
import { ExperimentSegmentExclusion } from '../../../src/api/models/ExperimentSegmentExclusion';
import { ExperimentSegmentInclusion } from '../../../src/api/models/ExperimentSegmentInclusion';
import { FeatureFlagSegmentExclusion } from '../../../src/api/models/FeatureFlagSegmentExclusion';
import { FeatureFlagSegmentInclusion } from '../../../src/api/models/FeatureFlagSegmentInclusion';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { GroupEnrollmentRepository } from '../../../src/api/repositories/GroupEnrollmentRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { Container } from '../../../src/typeorm-typedi-extensions';

const exp = new Experiment();
const ff = new FeatureFlag();
const seg2 = new Segment();
const seg1 = new Segment();
const newSeg = new Segment();
const newList = new Segment();
const segValSegment = new Segment();
const logger = new UpgradeLogger();
const segmentArr = [seg1, seg2];
const segVal = new SegmentInputValidator();
const listVal = new ListInputValidator();
const include = [{ segment: seg1, experiment: exp }];
const ff_include = [{ segment: seg1, featureFlag: ff }];
const segValImportFile: SegmentFile = {
  fileName: 'seg1.json',
  fileContent: '',
};

describe('Segment Service Testing', () => {
  let service: SegmentService;
  let repo: SegmentRepository;
  let module: TestingModule;
  let dataSource: DataSource;

  const queryBuilderMock = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(segmentArr),
    getOne: jest.fn().mockResolvedValue(seg1),
    getAllSegments: jest.fn().mockResolvedValue(segmentArr),
    delete: jest.fn().mockReturnThis(),
  };

  const entityManagerMock = { createQueryBuilder: () => queryBuilderMock, getRepository: () => repo };

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      database: 'postgres',
      entities: [
        IndividualForSegment,
        GroupForSegment,
        Segment,
        ExperimentSegmentExclusion,
        ExperimentSegmentInclusion,
        FeatureFlagSegmentExclusion,
        FeatureFlagSegmentInclusion,
      ],
      synchronize: true,
    });

    const mockTransaction = jest.fn(async (passedFunction) => await passedFunction(entityManagerMock));
    dataSource.transaction = mockTransaction;
    Container.setDataSource('default', dataSource);

    exp.id = 'exp1';
    exp.state = EXPERIMENT_STATE.ENROLLING;
    ff.id = 'ff1';
    ff.status = FEATURE_FLAG_STATUS.ENABLED;
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
    newSeg.id = 'newsegId';
    newSeg.context = 'add';
    newSeg.name = 'newSeg';
    newSeg.type = SEGMENT_TYPE.PUBLIC;
    newList.id = 'newListId';
    newList.subSegments = [];
    newList.context = 'add';
    newList.name = 'newList';
    newSeg.subSegments = [];
    newSeg.subSegments.push(newList);
    newList.type = SEGMENT_TYPE.PRIVATE;
    module = await Test.createTestingModule({
      providers: [
        DataSource,
        SegmentService,
        IndividualForSegmentRepository,
        GroupForSegmentRepository,
        ExperimentSegmentExclusionRepository,
        ExperimentSegmentInclusionRepository,
        FeatureFlagSegmentExclusionRepository,
        FeatureFlagSegmentInclusionRepository,
        IndividualEnrollmentRepository,
        GroupEnrollmentRepository,
        IndividualExclusionRepository,
        GroupExclusionRepository,
        CacheService,
        SegmentRepository,
        {
          provide: getDataSourceToken('default'),
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(SegmentRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            find: jest.fn().mockResolvedValue(segmentArr),
            delete: jest.fn(),
            countBy: jest.fn().mockResolvedValue(segmentArr.length),
            getAllSegments: jest.fn().mockResolvedValue(segmentArr),
            deleteSegment: jest.fn().mockImplementation((seg) => {
              return seg;
            }),
            deleteSegments: jest.fn().mockImplementation((seg) => {
              return seg;
            }),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              setParameter: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
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
          provide: getRepositoryToken(FeatureFlagSegmentExclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            delete: jest.fn(),
            getFeatureFlagSegmentExclusionData: jest.fn().mockResolvedValue(ff_include),
            createQueryBuilder: jest.fn(() => ({
              insert: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(segmentArr),
            })),
          },
        },
        {
          provide: getRepositoryToken(FeatureFlagSegmentInclusionRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(seg1),
            save: jest.fn().mockResolvedValue(seg1),
            delete: jest.fn(),
            getFeatureFlagSegmentInclusionData: jest.fn().mockResolvedValue(ff_include),
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
            deleteIndividualForSegmentById: jest.fn(),
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
            deleteGroupForSegmentById: jest.fn(),
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
    service.getExperimentSegmentExclusionDocBySegmentId = jest.fn().mockResolvedValue([]);
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

  it('should return all segments with status for enrolling experiments and feature flags', async () => {
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
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const segments = await service.getAllSegmentWithStatus(logger);
    expect(segments).toEqual(res);
  });

  it('should return all segments with status for not enrolling experiments and feature flags', async () => {
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
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const segments = await service.getAllSegmentWithStatus(logger);
    expect(segments).toEqual(res);
  });

  it('should return single segments with status', async () => {
    const res = {
      segment: {
        id: seg1.id,
        context: 'add',
        status: 'Used',
        subSegments: seg1.subSegments,
        groupForSegment: seg1.groupForSegment,
        individualForSegment: seg1.individualForSegment,
      },
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const segment = await service.getSingleSegmentWithStatus(seg1.id, logger);
    expect(segment).toEqual(res);
  });

  it('should return experiment segment exclusion data', async () => {
    const segments = await service.getExperimentSegmentExclusionData();
    expect(segments).toEqual(include);
  });

  it('should return experiment segment inclusion data', async () => {
    const segments = await service.getExperimentSegmentInclusionData();
    expect(segments).toEqual(include);
  });

  it('should return feture flag segment exclusion data', async () => {
    const segments = await service.getFeatureFlagSegmentExclusionData();
    expect(segments).toEqual(ff_include);
  });

  it('should return feature flag segment inclusion data', async () => {
    const segments = await service.getFeatureFlagSegmentInclusionData();
    expect(segments).toEqual(ff_include);
  });

  it('should upsert a segment with id (edit)', async () => {
    service.checkIsDuplicateSegmentName = jest.fn().mockResolvedValue(false);
    const segments = await service.upsertSegment(segVal, logger);
    expect(segments).toEqual(seg1);
  });

  it('should upsert a segment with no id (add)', async () => {
    service.checkIsDuplicateSegmentName = jest.fn().mockResolvedValue(false);
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
    repo.find = jest.fn().mockResolvedValue([]);
    expect(async () => {
      await service.upsertSegment(segment, logger);
    }).rejects.toThrow(new Error('Error in creating individualDocs, groupDocs in "addSegmentInDB"'));
  });

  it('should throw an error if the segment has a duplicate name', async () => {
    const dupeError = new Error(
      JSON.stringify({
        type: SERVER_ERROR.SEGMENT_DUPLICATE_NAME,
        message: `Segment name ${segVal.name} already exists in context ${segVal.context}`,
        duplicateName: segVal.name,
        context: segVal.context, // Fix: Make sure this is a string, not the segment object
        httpCode: 400,
      })
    );

    const addSegment = { ...segVal, id: undefined };

    // Make sure this mock is on the service instance being tested
    service.checkIsDuplicateSegmentName = jest.fn().mockImplementation(() => {
      throw dupeError;
    });

    // Also verify that addSegmentDataInDB isn't being called
    service.addSegmentDataInDB = jest.fn();

    expect(async () => {
      await service.upsertSegment(addSegment, logger);
    }).rejects.toThrow(dupeError);

    // Verify checkIsDuplicateSegmentName was called with correct parameters
    expect(service.checkIsDuplicateSegmentName).toHaveBeenCalledWith(segVal.name, segVal.context, logger);

    // Verify addSegmentDataInDB was never called
    expect(service.addSegmentDataInDB).not.toHaveBeenCalled();
  });

  it('should throw an error when unable to delete segment', async () => {
    service.checkIsDuplicateSegmentName = jest.fn().mockResolvedValue(false);
    const err = new Error('error');
    const indivRepo = module.get<IndividualForSegmentRepository>(getRepositoryToken(IndividualForSegmentRepository));
    indivRepo.insertIndividualForSegment = jest.fn().mockImplementation(() => {
      throw err;
    });
    repo.find = jest.fn().mockResolvedValue([]);

    expect(async () => {
      await service.upsertSegment(segVal, logger);
    }).rejects.toThrow(err);
  });

  it('should throw an error when unable to save segment', async () => {
    service.checkIsDuplicateSegmentName = jest.fn().mockResolvedValue(false);
    const err = new Error('error');
    repo.find = jest.fn().mockResolvedValue([]);
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
        fileName: 'seg1.json',
        error: null,
        compatibilityType: IMPORT_COMPATIBILITY_TYPE.COMPATIBLE,
      },
    ];
    service.getSegmentByIds = jest.fn().mockResolvedValue([seg1, seg2]);
    repo.find = jest.fn().mockResolvedValue([]);
    service.addSegmentDataInDB = jest.fn().mockResolvedValue(segValSegment);
    const segments = await service.importSegments([segValImportFile], logger);
    expect(segments).toEqual(returnSegment);
  });

  it('should import a segment list', async () => {
    const returnSegment = [
      {
        fileName: 'seg1.json',
        error: null,
        compatibilityType: IMPORT_COMPATIBILITY_TYPE.COMPATIBLE,
      },
    ];
    service.getSegmentByIds = jest.fn().mockResolvedValue([seg1, seg2]);
    repo.find = jest.fn().mockResolvedValue([]);
    service.addList = jest.fn().mockResolvedValue(segValSegment);
    const segments = await service.importLists({ parentSegmentId: 'seg1', files: [segValImportFile] }, logger);
    expect(segments).toEqual(returnSegment);
  });

  it('should throw an error when trying to import a segment that includes an unknown subsegment', async () => {
    const returnSegment = [
      {
        fileName: 'seg1.json',
        error:
          'Invalid Segment data: ' +
          'SubSegment: seg2 not found. Please import subSegment with same context and link in segment. ',
        compatibilityType: IMPORT_COMPATIBILITY_TYPE.WARNING,
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

  it('should add a list', async () => {
    service.upsertSegmentInPipeline = jest.fn().mockResolvedValue(segValSegment);
    const segment = await service.addList(listVal, logger);
    expect(segment).toEqual(segValSegment);
  });

  it('should delete a list from a segment', async () => {
    service.getSegmentById = jest.fn().mockResolvedValue(newSeg);
    const deletedList = await service.deleteList(newList.id, newSeg.id, logger);
    expect(deletedList).toEqual(newList.id);
  });

  it('should throw an error on attempting to delete a list not found on the parent segment', async () => {
    service.getSegmentById = jest.fn().mockResolvedValue(seg1);
    const err = new Error('List newListId not found in parent segment seg1');
    expect(async () => {
      await service.deleteList(newList.id, seg1.id, logger);
    }).rejects.toThrow(err);
  });

  it('should return a count of public segment', async () => {
    const results = await service.getTotalPublicSegmentCount();
    expect(results).toEqual(segmentArr.length);
  });

  it('should find all paginated segments with search string all', async () => {
    const res = {
      segmentsData: segmentArr.map((segment) => {
        return { ...segment, status: 'Used' };
      }),
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: SEGMENT_SEARCH_KEY.ALL,
        string: '',
      },
      {
        key: SEGMENT_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
      }
    );
    expect(results).toEqual(res);
  });

  it('should find all paginated segments with search string tag', async () => {
    const res = {
      segmentsData: segmentArr.map((segment) => {
        return { ...segment, status: 'Used' };
      }),
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: SEGMENT_SEARCH_KEY.TAG,
        string: '',
      },
      {
        key: SEGMENT_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
      }
    );
    expect(results).toEqual(res);
  });

  it('should find all paginated segmentss with search string name', async () => {
    const res = {
      segmentsData: segmentArr.map((segment) => {
        return { ...segment, status: 'Used' };
      }),
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: SEGMENT_SEARCH_KEY.NAME,
        string: '',
      },
      {
        key: SEGMENT_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
      }
    );
    expect(results).toEqual(res);
  });

  it('should find all paginated segments with search string context', async () => {
    const res = {
      segmentsData: segmentArr.map((segment) => {
        return { ...segment, status: 'Used' };
      }),
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const results = await service.findPaginated(
      1,
      2,
      logger,
      {
        key: SEGMENT_SEARCH_KEY.CONTEXT,
        string: '',
      },
      {
        key: SEGMENT_SORT_KEY.NAME,
        sortAs: SORT_AS_DIRECTION.ASCENDING,
      }
    );
    expect(results).toEqual(res);
  });

  it('should find all paginated segments without search params', async () => {
    const res = {
      segmentsData: segmentArr.map((segment) => {
        return { ...segment, status: 'Used' };
      }),
      experimentSegmentExclusionData: [{ experiment: exp, segment: seg1 }],
      experimentSegmentInclusionData: [{ experiment: exp, segment: seg1 }],
      featureFlagSegmentExclusionData: [{ featureFlag: ff, segment: seg1 }],
      featureFlagSegmentInclusionData: [{ featureFlag: ff, segment: seg1 }],
    };
    const results = await service.findPaginated(1, 2, logger);
    expect(results).toEqual(res);
  });
});
