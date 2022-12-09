import {
  Connection,
  ConnectionManager,
  DeleteQueryBuilder,
  EntityManager,
  InsertQueryBuilder,
  SelectQueryBuilder,
} from 'typeorm';
import * as sinon from 'sinon';
import { ExperimentConditionRepository } from '../../../src/api/repositories/ExperimentConditionRepository';
import { ExperimentCondition } from '../../../src/api/models/ExperimentCondition';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<ExperimentConditionRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<ExperimentConditionRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<ExperimentConditionRepository>(null);
const repo = new ExperimentConditionRepository();
const err = new Error('test error');

const experimentCond = new ExperimentCondition();
experimentCond.id = 'id1';
experimentCond.twoCharacterId = 'ab';

const result = {
  identifiers: [{ id: experimentCond.id }],
  generatedMaps: [experimentCond],
  raw: [experimentCond],
};

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(ExperimentConditionRepository.prototype);

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

describe('ExperimentConditionRepository Testing', () => {
  it('should upsert a new experiment condition', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(5).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.upsertExperimentCondition(experimentCond, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual(experimentCond);
  });

  it('should throw an error when upsert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(5).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.upsertExperimentCondition(experimentCond, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should insert new experiment conditions', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertConditions([experimentCond], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([experimentCond]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertConditions([experimentCond], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete experiment conditions', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteByIds([experimentCond.id], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([experimentCond]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByIds([experimentCond.id], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should delete an experiment condition', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    await repo.deleteCondition(experimentCond.id, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteCondition(experimentCond.id, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should get all unique experiment conditions', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentConditionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock
      .expects('getMany')
      .once()
      .returns(Promise.resolve([experimentCond, experimentCond]));

    const res = await repo.getAllUniqueIdentifier();

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual([experimentCond.twoCharacterId, experimentCond.twoCharacterId]);
  });

  it('should throw an error when get unique experiment conditions fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentConditionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getAllUniqueIdentifier();
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
