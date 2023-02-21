import { Connection, DeleteQueryBuilder, EntityManager, InsertQueryBuilder, SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { QueryRepository } from '../../../src/api/repositories/QueryRepository';
import { Query } from '../../../src/api/models/Query';

let sandbox;
let connection;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
let manager;
const insertQueryBuilder = new InsertQueryBuilder<QueryRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<QueryRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<QueryRepository>(null);
const repo = new QueryRepository();
const err = new Error('test error');

const query = new Query();
query.id = 'id1';

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

describe('QueryRepository Testing', () => {
  it('should upsert a new query', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: query.id }],
      generatedMaps: [query],
      raw: [query],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(4).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.upsertQuery(query, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual(query);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(4).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.upsertQuery(query, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a query', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: query.id }],
      generatedMaps: [query],
      raw: [query],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    await repo.deleteQuery(query.id, manager);

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
      await repo.deleteQuery(query.id, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should insert several queries', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: query.id }],
      generatedMaps: [query],
      raw: [query],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertQueries([query, query], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([query]);
  });

  it('should throw an error when inserting queries fail', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertQueries([query, query], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should check if query exists and return true when query exists', async () => {
    createQueryBuilderStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    const result = [query];

    selectMock.expects('innerJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.checkIfQueryExists(query.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(true);
  });

  it('should check if query exists and return false when query does not exist', async () => {
    createQueryBuilderStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);
    const result = [];

    selectMock.expects('innerJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.checkIfQueryExists('id2');

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(false);
  });

  it('should throw an error when finding a query fails', async () => {
    createQueryBuilderStub = sandbox.stub(QueryRepository.prototype, 'createQueryBuilder').returns(selectQueryBuilder);

    selectMock.expects('innerJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.checkIfQueryExists(query.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
