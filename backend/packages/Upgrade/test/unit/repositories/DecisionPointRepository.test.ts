import {
  Connection,
  ConnectionManager,
  DeleteQueryBuilder,
  EntityManager,
  InsertQueryBuilder,
  SelectQueryBuilder,
} from 'typeorm';
import * as sinon from 'sinon';
import { DecisionPointRepository } from '../../../src/api/repositories/DecisionPointRepository';
import { DecisionPoint } from '../../../src/api/models/DecisionPoint';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<DecisionPointRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<DecisionPointRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<DecisionPointRepository>(null);
const repo = new DecisionPointRepository();
const err = new Error('test error');

const decisionPoint = new DecisionPoint();
decisionPoint.id = 'id1';
decisionPoint.excludeIfReached = true;

const result = {
  identifiers: [{ id: decisionPoint.id }],
  generatedMaps: [decisionPoint],
  raw: [decisionPoint],
};

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(DecisionPointRepository.prototype);

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

describe('DecisionPointRepository Testing', () => {
  it('should upsert a new decision point', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(4).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.upsertDecisionPoint(decisionPoint, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual(decisionPoint);
  });

  it('should throw an error when upsert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(4).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.upsertDecisionPoint(decisionPoint, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should insert new decision points', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertDecisionPoint([decisionPoint], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([decisionPoint]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertDecisionPoint([decisionPoint], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete decision points', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteByIds([decisionPoint.id], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([decisionPoint]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByIds([decisionPoint.id], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should delete an decision point', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    await repo.deleteDecisionPoint(decisionPoint.id, manager);

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
      await repo.deleteDecisionPoint(decisionPoint.id, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should get all unique decision points', async () => {
    createQueryBuilderStub = sandbox
      .stub(DecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock
      .expects('getMany')
      .once()
      .returns(Promise.resolve([decisionPoint, decisionPoint]));

    const res = await repo.getAllUniqueIdentifier();

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual([decisionPoint.twoCharacterId, decisionPoint.twoCharacterId]);
  });

  it('should throw an error when get unique decision points fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(DecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getAllUniqueIdentifier();
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should get decision point and name', async () => {
    createQueryBuilderStub = sandbox
      .stub(DecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock
      .expects('getMany')
      .once()
      .returns(Promise.resolve([decisionPoint, decisionPoint]));

    const res = await repo.partitionPointAndName();

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual([decisionPoint, decisionPoint]);
  });

  it('should throw an error when get decision point and name fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(DecisionPointRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.partitionPointAndName();
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
