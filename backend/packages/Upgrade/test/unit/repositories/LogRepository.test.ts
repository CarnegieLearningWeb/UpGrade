import { DataSource } from 'typeorm';
import { LogRepository } from '../../../src/api/repositories/LogRepository';
import { Log } from '../../../src/api/models/Log';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { Query } from '../../../src/api/models/Query';
import { Metric } from '../../../src/api/models/Metric';
import { Experiment } from '../../../src/api/models/Experiment';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';
import { IMetricMetaData, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';

let mock;
let manager;
let dataSource: DataSource;
let repo: LogRepository;
let queryRepo: QueryRepository;
let metricRepo: MetricRepository;
let individualEnrollmentRepo: IndividualEnrollmentRepository;
let queryMock;
let individualEnrollmentMock;
const err = new Error('test error');

const log = new Log();
log.id = 'id1';
const user = new ExperimentUser();
user.id = 'user1';
log.user = user;

const result = {
  identifiers: [{ id: log.id }],
  generatedMaps: [log],
  raw: [log],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [LogRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(LogRepository);
  queryRepo = Container.getCustomRepository(QueryRepository);
  metricRepo = Container.getCustomRepository(MetricRepository);
  individualEnrollmentRepo = Container.getCustomRepository(IndividualEnrollmentRepository);

  const commonMockData = initializeMocks(result);
  const queryMockData = initializeMocks(result);
  const metricMockData = initializeMocks(result);
  const individualEnrollmentMockData = initializeMocks(result);

  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  queryRepo.createQueryBuilder = queryMockData.createQueryBuilder;
  metricRepo.createQueryBuilder = metricMockData.createQueryBuilder;
  individualEnrollmentRepo.createQueryBuilder = individualEnrollmentMockData.createQueryBuilder;

  mock = commonMockData.mocks;
  queryMock = queryMockData.mocks;
  individualEnrollmentMock = individualEnrollmentMockData.mocks;

  manager = {
    createQueryBuilder: repo.createQueryBuilder,
    withRepository: jest.fn().mockReturnValue(individualEnrollmentRepo),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('LogRepository Testing', () => {
  it('should delete except ids', async () => {
    const res = await repo.deleteExceptByIds([log.id], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([log]);
  });

  it('should delete all logs', async () => {
    const res = await repo.deleteExceptByIds([], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).not.toHaveBeenCalled();
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([log]);
  });

  it('should throw an error when delete except ids fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteExceptByIds([log.id], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete all fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteExceptByIds([], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).not.toHaveBeenCalled();
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should update log', async () => {
    const res = await repo.updateLog(log.id, {}, new Date('2019-01-16'));

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([log]);
  });

  it('should throw an error when update log fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.updateLog(log.id, {}, new Date('2019-01-16'));
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.set).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete by metric id', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(queryRepo);
    queryMock.execute.mockResolvedValue([log]);
    mock.execute.mockResolvedValue(result);

    const res = await repo.deleteByMetricId('metrickey');

    expect(Container.getCustomRepository).toHaveBeenCalledWith(QueryRepository);

    expect(queryRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(queryMock.select).toHaveBeenCalledTimes(1);
    expect(queryMock.innerJoin).toHaveBeenCalledTimes(2);
    expect(queryMock.execute).toHaveBeenCalledTimes(1);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should delete all logs when no metrics found', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(queryRepo);
    queryMock.execute.mockResolvedValue([]);
    mock.execute.mockResolvedValue(result);

    const res = await repo.deleteByMetricId('metrickey');

    expect(Container.getCustomRepository).toHaveBeenCalledWith(QueryRepository);

    expect(queryRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(queryMock.select).toHaveBeenCalledTimes(1);
    expect(queryMock.innerJoin).toHaveBeenCalledTimes(2);
    expect(queryMock.execute).toHaveBeenCalledTimes(1);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).not.toHaveBeenCalled();
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when the metric query fails', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(queryRepo);
    queryMock.execute.mockRejectedValue(err);

    await expect(async () => {
      await repo.deleteByMetricId('metrickey');
    }).rejects.toThrow(err);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(QueryRepository);

    expect(queryRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(queryMock.select).toHaveBeenCalledTimes(1);
    expect(queryMock.innerJoin).toHaveBeenCalledTimes(2);
    expect(queryMock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete by metric id fails', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(queryRepo);
    queryMock.execute.mockResolvedValue([log]);
    mock.execute.mockRejectedValue(err);

    await expect(async () => {
      await repo.deleteByMetricId('metrickey');
    }).rejects.toThrow(err);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(QueryRepository);

    expect(queryRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(queryMock.select).toHaveBeenCalledTimes(1);
    expect(queryMock.innerJoin).toHaveBeenCalledTimes(2);
    expect(queryMock.execute).toHaveBeenCalledTimes(1);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete all fails', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(queryRepo);
    queryMock.execute.mockResolvedValue([]);
    mock.execute.mockRejectedValue(err);

    await expect(async () => {
      await repo.deleteByMetricId('metrickey');
    }).rejects.toThrow(err);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(QueryRepository);

    expect(queryRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(queryMock.select).toHaveBeenCalledTimes(1);
    expect(queryMock.innerJoin).toHaveBeenCalledTimes(2);
    expect(queryMock.execute).toHaveBeenCalledTimes(1);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).not.toHaveBeenCalled();
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get metric uniquifier data', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(metricRepo);
    metricRepo.query = jest.fn().mockResolvedValue(result);

    const res = await repo.getMetricUniquifierData([{ key: 'metrickey', uniquifier: 'uniquifierkey' }], 'uid');

    expect(Container.getCustomRepository).toHaveBeenCalledWith(MetricRepository);

    expect(metricRepo.query).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should throw an error when get metric uniquifier data fails', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(metricRepo);
    metricRepo.query = jest.fn().mockRejectedValue(err);

    expect(async () => {
      await repo.getMetricUniquifierData([{ key: 'metrickey', uniquifier: 'uniquifierkey' }], 'uid');
    }).rejects.toThrow(err);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(MetricRepository);

    expect(metricRepo.query).toHaveBeenCalledTimes(1);
  });

  // TODO: Work in progress
  it('should analyse a continuous simple metric sum', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);

    const q = new Query();
    q.id = 'id1';
    q.name = 'Average Time';
    const exp = new Experiment();
    exp.id = 'exp1';
    q.experiment = exp;
    const m = new Metric();
    m.key = 'totalTimeSeconds';
    m.type = IMetricMetaData.CONTINUOUS;
    q.metric = m;
    q.query = {
      operationType: OPERATION_TYPES.SUM,
      compareFn: '=',
      compareValue: '10',
    };

    const res = await repo.analysis(q, manager);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository, 'export');

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.getRawMany).toHaveBeenCalledTimes(1);
    expect(res).toEqual(result);
  });

  it('should analyse a continuous simple metric median', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);

    const q = new Query();
    q.id = 'id1';
    q.name = 'Average Time';
    const exp = new Experiment();
    exp.id = 'exp1';
    q.experiment = exp;
    const m = new Metric();
    m.key = 'totalTimeSeconds';
    m.type = IMetricMetaData.CONTINUOUS;
    q.metric = m;
    q.query = {
      operationType: OPERATION_TYPES.MEDIAN,
      compareFn: '=',
      compareValue: '10',
    };

    const res = await repo.analysis(q, manager);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository, 'export');

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.getRawMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should analyse a continuous simple metric mode', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);

    const q = new Query();
    q.id = 'id1';
    q.name = 'Average Time';
    const exp = new Experiment();
    exp.id = 'exp1';
    q.experiment = exp;
    const m = new Metric();
    m.key = 'totalTimeSeconds';
    m.type = IMetricMetaData.CONTINUOUS;
    q.metric = m;
    q.query = {
      operationType: OPERATION_TYPES.MODE,
      compareFn: '=',
      compareValue: '10',
    };

    const res = await repo.analysis(q, manager);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository, 'export');

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.getRawMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should analyse a continuous simple metric count', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);

    const q = new Query();
    q.id = 'id1';
    q.name = 'Average Time';
    const exp = new Experiment();
    exp.id = 'exp1';
    q.experiment = exp;
    const m = new Metric();
    m.key = 'totalTimeSeconds';
    m.type = IMetricMetaData.CONTINUOUS;
    q.metric = m;
    q.query = {
      operationType: OPERATION_TYPES.COUNT,
      compareFn: '=',
      compareValue: '10',
    };

    const res = await repo.analysis(q, manager);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository, 'export');

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.getRawMany).toHaveBeenCalledTimes(1);
    expect(res).toEqual(result);
  });

  it('should analyse a continuous repeated metric most recent avg', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);

    const q = new Query();
    q.id = 'id1';
    q.name = 'Average Time';
    const exp = new Experiment();
    exp.id = 'exp1';
    q.experiment = exp;
    const m = new Metric();
    m.key = 'masteryWorkspace@__@calculating_area_various_figures@__@timeSeconds';
    m.type = IMetricMetaData.CONTINUOUS;
    q.metric = m;
    q.query = {
      operationType: OPERATION_TYPES.AVERAGE,
      compareFn: '=',
      compareValue: 10,
    };
    q.repeatedMeasure = REPEATED_MEASURE.mostRecent;

    const res = await repo.analysis(q, manager);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository, 'export');

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.getRawMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual(result);
  });

  it('should analyse a categorical repeated metric earliest percentage', async () => {
    jest.spyOn(Container, 'getCustomRepository').mockReturnValueOnce(individualEnrollmentRepo);

    const data1 = {
      conditionId: 1,
      result: 10,
    };
    const data2 = {
      conditionId: 2,
      result: 10,
    };
    individualEnrollmentMock.getRawMany.mockResolvedValue([data1, data2]);

    const q = new Query();
    q.id = 'id1';
    q.name = 'Average Time';
    const exp = new Experiment();
    exp.id = 'exp1';
    q.experiment = exp;
    const m = new Metric();
    m.key = 'masteryWorkspace@__@calculating_area_various_figures@__@timeSeconds';
    m.type = IMetricMetaData.CATEGORICAL;
    q.metric = m;
    q.query = {
      operationType: OPERATION_TYPES.PERCENTAGE,
      compareFn: '=',
      compareValue: 'GRADUATED',
    };
    q.repeatedMeasure = REPEATED_MEASURE.earliest;

    const res = await repo.analysis(q, manager);

    expect(Container.getCustomRepository).toHaveBeenCalledWith(IndividualEnrollmentRepository, 'export');

    expect(individualEnrollmentRepo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(individualEnrollmentMock.innerJoin).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.where).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.groupBy).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.select).toHaveBeenCalledTimes(1);
    expect(individualEnrollmentMock.getRawMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual([
      { conditionId: 1, result: 10 },
      { conditionId: 2, result: 10 },
    ]);
  });
});
