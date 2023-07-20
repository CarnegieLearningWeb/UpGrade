import {
  Connection,
  DeleteQueryBuilder,
  EntityManager,
  UpdateQueryBuilder,
  SelectQueryBuilder,
  ConnectionManager,
} from 'typeorm';
import * as sinon from 'sinon';
import { LogRepository } from '../../../src/api/repositories/LogRepository';
import { Log } from '../../../src/api/models/Log';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { Query } from '../../../src/api/models/Query';
import { Metric } from '../../../src/api/models/Metric';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { IMetricMetaData, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let updateMock, deleteMock, selectMock;
const updateQueryBuilder = new UpdateQueryBuilder<LogRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<LogRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<LogRepository>(null);
const repo = new LogRepository();
const err = new Error('test error');

const log = new Log();
log.id = 'id1';
const user = new ExperimentUser();
user.id = 'user1';
log.user = user;

beforeEach(() => {
  sandbox = sinon.createSandbox();
  connection = sinon.createStubInstance(Connection);
  manager = new EntityManager(connection);
  const repocallback = sinon.stub();
  repocallback.withArgs(Query).returns(QueryRepository.prototype);
  repocallback.withArgs(Metric).returns(MetricRepository.prototype);
  repocallback.withArgs(Experiment).returns(ExperimentRepository.prototype);
  repocallback.returns(LogRepository.prototype);

  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    getRepository: repocallback,
  } as unknown as Connection);
  updateMock = sandbox.mock(updateQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('LogRepository Testing', () => {
  it('should delete except ids', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteExceptByIds([log.id], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([log]);
  });

  it('should delete all logs', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteExceptByIds([], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([log]);
  });

  it('should throw an error when delete except ids fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteExceptByIds([log.id], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should throw an error when delete all fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteExceptByIds([], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should update log', async () => {
    createQueryBuilderStub = sandbox.stub(LogRepository.prototype, 'createQueryBuilder').returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };
    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateLog(log.id, {}, new Date('2019-01-16'));

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual([log]);
  });

  it('should throw an error when update log fails', async () => {
    createQueryBuilderStub = sandbox.stub(LogRepository.prototype, 'createQueryBuilder').returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateLog(log.id, {}, new Date('2019-01-16'));
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();
  });

  it('should delete by metric id', async () => {
    createQueryBuilderStub = sandbox.stub(LogRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);
    const queryStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };
    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .once()
      .returns(Promise.resolve([log]));
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteByMetricId('metrickey');

    sinon.assert.calledOnce(queryStub);
    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should delete all logs when no metrics found', async () => {
    createQueryBuilderStub = sandbox.stub(LogRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);
    const queryStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };
    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.resolve([]));
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteByMetricId('metrickey');

    sinon.assert.calledOnce(queryStub);
    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when the metric query fails', async () => {
    const queryStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByMetricId('metrickey');
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(queryStub);
    selectMock.verify();
  });

  it('should throw an error when delete by metric id fails', async () => {
    createQueryBuilderStub = sandbox.stub(LogRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);
    const queryStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock
      .expects('execute')
      .once()
      .returns(Promise.resolve([log]));
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByMetricId('metrickey');
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(queryStub);
    selectMock.verify();
  });

  it('should throw an error when delete all fails', async () => {
    createQueryBuilderStub = sandbox.stub(LogRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);
    const queryStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.resolve([]));
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByMetricId('metrickey');
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(queryStub);
    selectMock.verify();
  });

  it('should get metric uniquifier data', async () => {
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };
    const metricStub = sandbox.stub(MetricRepository.prototype, 'query').returns(Promise.resolve(result));

    const res = await repo.getMetricUniquifierData([{ key: 'metrickey', uniquifier: 'uniquifierkey' }], 'uid');

    sinon.assert.calledOnce(metricStub);

    expect(res).toEqual(result);
  });

  it('should throw an error when get metric uniquifier data fails', async () => {
    const metricStub = sandbox.stub(MetricRepository.prototype, 'query').returns(Promise.reject(err));

    expect(async () => {
      await repo.getMetricUniquifierData([{ key: 'metrickey', uniquifier: 'uniquifierkey' }], 'uid');
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(metricStub);
  });

  it('should analyse a continuous simple metric sum', async () => {
    const experimentStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };

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

    selectMock.expects('innerJoin').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('innerJoinAndSelect').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').exactly(8).returns(selectQueryBuilder);
    selectMock.expects('getRawMany').once().returns(Promise.resolve(result));
    const res = await repo.analysis(q);

    sinon.assert.calledTwice(experimentStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should analyse a continuous simple metric median', async () => {
    const experimentStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };

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

    selectMock.expects('innerJoin').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('innerJoinAndSelect').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').exactly(8).returns(selectQueryBuilder);
    selectMock.expects('getRawMany').once().returns(Promise.resolve(result));
    const res = await repo.analysis(q);

    sinon.assert.calledTwice(experimentStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should analyse a continuous simple metric mode', async () => {
    const experimentStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };

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

    selectMock.expects('innerJoin').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('innerJoinAndSelect').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').exactly(8).returns(selectQueryBuilder);
    selectMock.expects('getRawMany').once().returns(Promise.resolve(result));
    const res = await repo.analysis(q);

    sinon.assert.calledTwice(experimentStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should analyse a continuous simple metric count', async () => {
    const experimentStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };

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

    selectMock.expects('innerJoin').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('innerJoinAndSelect').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').exactly(8).returns(selectQueryBuilder);
    selectMock.expects('getRawMany').once().returns(Promise.resolve(result));
    const res = await repo.analysis(q);

    sinon.assert.calledTwice(experimentStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should analyse a continuous repeated metric most recent avg', async () => {
    const experimentStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: log.id }],
      generatedMaps: [log],
      raw: [log],
    };

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

    selectMock.expects('innerJoin').exactly(4).returns(selectQueryBuilder);
    selectMock.expects('innerJoinAndSelect').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').exactly(8).returns(selectQueryBuilder);
    selectMock.expects('getRawMany').once().returns(Promise.resolve(result));
    const res = await repo.analysis(q);

    sinon.assert.calledTwice(experimentStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should analyse a categorical repeated metric earliest percentage', async () => {
    const experimentStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const data1 = {
      conditionId: 1,
      result: 10,
    };
    const data2 = {
      conditionId: 2,
      result: 10,
    };

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

    selectMock.expects('innerJoin').exactly(4).returns(selectQueryBuilder);
    selectMock.expects('innerJoinAndSelect').exactly(6).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('andWhere').exactly(8).returns(selectQueryBuilder);
    selectMock.expects('addGroupBy').once().returns(selectQueryBuilder);
    selectMock
      .expects('getRawMany')
      .twice()
      .returns(Promise.resolve([data1, data2]));
    const res = await repo.analysis(q);

    sinon.assert.calledTwice(experimentStub);
    selectMock.verify();

    expect(res).toEqual([
      { conditionId: 1, result: 100 },
      { conditionId: 2, result: 100 },
    ]);
  });
});
