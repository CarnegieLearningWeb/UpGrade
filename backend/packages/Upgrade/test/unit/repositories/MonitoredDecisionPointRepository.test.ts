import { Connection, DeleteQueryBuilder, EntityManager, InsertQueryBuilder, SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { MonitoredDecisionPointRepository } from '../../../src/api/repositories/MonitoredDecisionPointRepository';
import { MonitoredDecisionPoint } from '../../../src/api/models/MonitoredDecisionPoint';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<MonitoredDecisionPointRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<MonitoredDecisionPointRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<MonitoredDecisionPointRepository>(null);
const repo = new MonitoredDecisionPointRepository();
const err = new Error('test error');

const point = new MonitoredDecisionPoint();
point.id = 'id1';
const user = new ExperimentUser();
user.id = 'user1';
point.user = user;

beforeEach(() => {
  sandbox = sinon.createSandbox();
  connection = sinon.createStubInstance(Connection);
  manager = new EntityManager(connection);

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('MonitoredDecisionPointRepository Testing', () => {
  it('should insert a new monitored experiment point', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: point.id }],
      generatedMaps: [point],
      raw: [point],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').twice().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson(point);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual(point);
  });

  it('should insert a new monitored experiment point', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: point.id }],
      generatedMaps: [point],
      raw: [],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').twice().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson(point);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual({});
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').twice().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.saveRawJson(point);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a monitored experiment point', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: point.id }],
      generatedMaps: [point],
      raw: [point],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteByExperimentId([point.id], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([point]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByExperimentId([point.id], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should get monitored experiment point count', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: point.id }],
      generatedMaps: [point],
      raw: [point],
    };

    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getCount').once().returns(Promise.resolve(result));

    const res = await repo.getMonitoredExperimentPointCount([point.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find point by id fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getCount').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getMonitoredExperimentPointCount([point.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should get monitored experiment point by date range', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: point.id }],
      generatedMaps: [point],
      raw: [point],
    };

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('andWhere').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.getByDateRange([point.id], new Date('2019-01-16'), new Date('2019-01-20'));

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should get monitored experiment point by date range with from undefined', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: point.id }],
      generatedMaps: [point],
      raw: [point],
    };

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('andWhere').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.getByDateRange([point.id], undefined, new Date('2019-01-20'));

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should get monitored experiment point by date range with to undefined', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: point.id }],
      generatedMaps: [point],
      raw: [point],
    };

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('andWhere').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.getByDateRange([point.id], new Date('2019-01-20'), undefined);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when get monitored experiment point by date range fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(MonitoredDecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('andWhere').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getByDateRange([point.id], new Date('2019-01-16'), new Date('2019-01-20'));
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
