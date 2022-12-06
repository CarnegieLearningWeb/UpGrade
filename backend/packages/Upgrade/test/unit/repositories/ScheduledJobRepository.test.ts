import { Connection, DeleteQueryBuilder, EntityManager, InsertQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { ScheduledJobRepository } from '../../../src/api/repositories/ScheduledJobRepository';
import { ScheduledJob } from '../../../src/api/models/ScheduledJob';

let sandbox;
let connection;
let createQueryBuilderStub;
let insertMock, deleteMock;
const insertQueryBuilder = new InsertQueryBuilder<ScheduledJobRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<ScheduledJobRepository>(null);
const repo = new ScheduledJobRepository();
const err = new Error('test error');

const job = new ScheduledJob();
job.id = 'id1';

beforeEach(() => {
  sandbox = sinon.createSandbox();
  connection = sinon.createStubInstance(Connection);

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('ScheduledJobRepository Testing', () => {
  it('should upsert a new scheduled job', async () => {
    createQueryBuilderStub = sandbox
      .stub(ScheduledJobRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: job.id }],
      generatedMaps: [job],
      raw: [job],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').twice().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.upsertScheduledJob(job);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual(job);
  });

  it('should upsert a new scheduled job when an EntityManager is provided', async () => {
    const manager = new EntityManager(connection);
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: job.id }],
      generatedMaps: [job],
      raw: [job],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').twice().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.upsertScheduledJob(job, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual(job);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ScheduledJobRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').twice().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.upsertScheduledJob(job);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a group experiment exclusion', async () => {
    const manager = new EntityManager(connection);
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: job.id }],
      generatedMaps: [job],
      raw: [job],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteByExperimentId(job.id, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([job]);
  });

  it('should throw an error when delete fails', async () => {
    const manager = new EntityManager(connection);
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByExperimentId(job.id, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });
});
