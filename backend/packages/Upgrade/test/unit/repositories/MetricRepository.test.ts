import { DeleteQueryBuilder, SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { MetricRepository } from '../../../src/api/repositories/MetricRepository';
import { Metric } from '../../../src/api/models/Metric';

let sandbox;
let createQueryBuilderStub;
let deleteMock, selectMock;
const deleteQueryBuilder = new DeleteQueryBuilder<MetricRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<MetricRepository>(null);
const repo = new MetricRepository();
const err = new Error('test error');

const metric = new Metric();
metric.key = 'key1';

beforeEach(() => {
  sandbox = sinon.createSandbox();

  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('MetricRepository Testing', () => {
  it('should delete a  metric', async () => {
    createQueryBuilderStub = sandbox.stub(MetricRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: metric.key }],
      generatedMaps: [metric],
      raw: [metric],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteMetricsByKeys(metric.key, 'jointext');

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([metric]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox.stub(MetricRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteMetricsByKeys(metric.key, 'jointext');
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should get metrics by key', async () => {
    createQueryBuilderStub = sandbox.stub(MetricRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: metric.key }],
      generatedMaps: [metric],
      raw: [metric],
    };

    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.getMetricsByKeys(metric.key, 'jointext');

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when get metric by key fails', async () => {
    createQueryBuilderStub = sandbox.stub(MetricRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getMetricsByKeys(metric.key, 'jointext');
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should get find metrics with queries', async () => {
    createQueryBuilderStub = sandbox.stub(MetricRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: metric.key }],
      generatedMaps: [metric],
      raw: [metric],
    };

    selectMock.expects('innerJoin').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findMetricsWithQueries([metric.key]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when get monitored experiment metric by date range fails', async () => {
    createQueryBuilderStub = sandbox.stub(MetricRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    selectMock.expects('innerJoin').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findMetricsWithQueries([metric.key]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
