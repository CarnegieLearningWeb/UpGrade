import { Connection, DeleteQueryBuilder, EntityManager, InsertQueryBuilder, UpdateQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { FeatureFlagRepository } from '../../../src/api/repositories/FeatureFlagRepository';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, updateMock;
const insertQueryBuilder = new InsertQueryBuilder<FeatureFlagRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<FeatureFlagRepository>(null);
const updateQueryBuilder = new UpdateQueryBuilder<FeatureFlagRepository>(null);
const repo = new FeatureFlagRepository();
const err = new Error('test error');

const flag = new FeatureFlag();
flag.id = 'id1';

beforeEach(() => {
  sandbox = sinon.createSandbox();
  connection = sinon.createStubInstance(Connection);
  manager = new EntityManager(connection);

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  updateMock = sandbox.mock(updateQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('FeatureFlagRepository Testing', () => {
  it('should insert a new flag', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: flag.id }],
      generatedMaps: [flag],
      raw: [flag],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertFeatureFlag(flag, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([flag]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertFeatureFlag(flag, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a flag', async () => {
    createQueryBuilderStub = sandbox
      .stub(FeatureFlagRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: flag.id }],
      generatedMaps: [flag],
      raw: [flag],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    await repo.deleteById(flag.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(FeatureFlagRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteById(flag.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should update flag', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: flag.id }],
      generatedMaps: [flag],
      raw: [flag],
    };

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateFeatureFlag(flag, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual([flag]);
  });

  it('should throw an error when update flag fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateFeatureFlag(flag, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should update flag state', async () => {
    createQueryBuilderStub = sandbox
      .stub(FeatureFlagRepository.prototype, 'createQueryBuilder')
      .returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: flag.id }],
      generatedMaps: [flag],
      raw: [flag],
    };

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateState(flag.id, true);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual([flag]);
  });

  it('should throw an error when update flag fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(FeatureFlagRepository.prototype, 'createQueryBuilder')
      .returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateState(flag.id, true);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });
});
