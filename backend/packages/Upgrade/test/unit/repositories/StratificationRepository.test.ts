import { Connection, ConnectionManager, DeleteQueryBuilder, InsertQueryBuilder, EntityManager } from 'typeorm';
import * as sinon from 'sinon';
import { StratificationFactorRepository } from '../../../src/api/repositories/StratificationFactorRepository';
import { StratificationFactor } from '../../../src/api/models/StratificationFactor';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock;
const insertQueryBuilder = new InsertQueryBuilder<StratificationFactorRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<StratificationFactorRepository>(null);
const repo = new StratificationFactorRepository();
const err = new Error('test error');
const logger = new UpgradeLogger();

const stratificationFactor = new StratificationFactor();
stratificationFactor.stratificationFactorName = 'factor1';

const result = {
  identifiers: [{ stratificationFactor: stratificationFactor.stratificationFactorName }],
  generatedMaps: [stratificationFactor],
  raw: [stratificationFactor],
};

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(StratificationFactorRepository.prototype);

  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    getRepository: repocallback,
  } as unknown as Connection);

  connection = sinon.createStubInstance(Connection);
  manager = new EntityManager(connection);

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('StratificationFactorRepository Testing', () => {
  it('should insert a new stratification factor', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertStratificationFactor([stratificationFactor], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
    expect(res).toEqual([stratificationFactor]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertStratificationFactor([stratificationFactor], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete stratification factor', async () => {
    createQueryBuilderStub = sandbox
      .stub(StratificationFactorRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));
    const res = await repo.deleteStratificationFactorByName(stratificationFactor.stratificationFactorName, logger);
    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
    expect(res).toEqual([stratificationFactor]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(StratificationFactorRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);
    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));
    expect(async () => {
      await repo.deleteStratificationFactorByName(stratificationFactor.stratificationFactorName, logger);
    }).rejects.toThrow(err);
    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });
});
