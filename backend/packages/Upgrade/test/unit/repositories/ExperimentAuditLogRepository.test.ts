import {
  Connection,
  ConnectionManager,
  DeleteQueryBuilder,
  EntityManager,
  InsertQueryBuilder,
  SelectQueryBuilder,
} from 'typeorm';
import * as sinon from 'sinon';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { ExperimentAuditLog } from '../../../src/api/models/ExperimentAuditLog';
import { EXPERIMENT_LOG_TYPE } from 'upgrade_types';
import { User } from '../../../src/api/models/User';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<ExperimentAuditLogRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<ExperimentAuditLogRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<ExperimentAuditLogRepository>(null);
const repo = new ExperimentAuditLogRepository();
const err = new Error('test error');

const experiment = new ExperimentAuditLog();
experiment.id = 'id1';

const result = {
  identifiers: [{ id: experiment.id }],
  generatedMaps: [experiment],
  raw: [experiment],
};

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(ExperimentAuditLogRepository.prototype);

  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    getRepository: repocallback,
  } as unknown as Connection);

  connection = sinon.createStubInstance(Connection);
  manager = new EntityManager(connection);

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('ExperimentAuditLogRepository Testing', () => {
  it('should save new audit log', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED, experiment, new User(), manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should save new audit log without entity manager', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED, experiment, new User(), null);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED, experiment, new User(), manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should clear logs', async () => {
    const stub = sandbox.stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder');
    stub.withArgs('audit').returns(selectQueryBuilder);
    stub.withArgs().returns(deleteQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('orderBy').once().returns(selectQueryBuilder);
    selectMock.expects('take').once().returns(selectQueryBuilder);
    selectMock.expects('getQuery').once().returns(experiment.id);
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.clearLogs(4);

    sinon.assert.calledTwice(stub);

    deleteMock.verify();
    selectMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when clear fails', async () => {
    const stub = sandbox.stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder');
    stub.withArgs('audit').returns(selectQueryBuilder);
    stub.withArgs().returns(deleteQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('orderBy').once().returns(selectQueryBuilder);
    selectMock.expects('take').once().returns(selectQueryBuilder);
    selectMock.expects('getQuery').once().returns(experiment.id);
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    await expect(() => repo.clearLogs(4)).rejects.toThrow();

    sinon.assert.calledTwice(stub);

    selectMock.verify();
    deleteMock.verify();
  });

  it('should get total logs', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getCount').once().returns(Promise.resolve(5));

    const res = await repo.getTotalLogs(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(5);
  });

  it('should throw an error when get total logs fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getCount').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getTotalLogs(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should find paginated', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('skip').once().returns(selectQueryBuilder);
    selectMock.expects('take').once().returns(selectQueryBuilder);
    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('orderBy').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.paginatedFind(3, 0, EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should find paginated with no filter', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('skip').once().returns(selectQueryBuilder);
    selectMock.expects('take').once().returns(selectQueryBuilder);
    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('orderBy').once().returns(selectQueryBuilder);
    selectMock.expects('where').never().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.paginatedFind(3, 0, null);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find paginated fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentAuditLogRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('skip').once().returns(selectQueryBuilder);
    selectMock.expects('take').once().returns(selectQueryBuilder);
    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('orderBy').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.paginatedFind(3, 0, EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
