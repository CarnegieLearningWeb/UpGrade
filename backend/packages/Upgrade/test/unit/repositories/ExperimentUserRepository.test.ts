import { InsertQueryBuilder, UpdateQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { ExperimentUserRepository } from '../../../src/api/repositories/ExperimentUserRepository';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';

let sandbox;
let createQueryBuilderStub;
let insertMock, updateMock;
const insertQueryBuilder = new InsertQueryBuilder<ExperimentUserRepository>(null);
const updateQueryBuilder = new UpdateQueryBuilder<ExperimentUserRepository>(null);
const repo = new ExperimentUserRepository();
const err = new Error('test error');

const user = new ExperimentUser();
user.id = 'user1';

beforeEach(() => {
  sandbox = sinon.createSandbox();

  insertMock = sandbox.mock(insertQueryBuilder);
  updateMock = sandbox.mock(updateQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('ExperimentUserRepository Testing', () => {
  it('should insert a new experiment user', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentUserRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: user.id }],
      generatedMaps: [user],
      raw: [user],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson(user);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([user]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentUserRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.saveRawJson(user);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should update working group', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentUserRepository.prototype, 'createQueryBuilder')
      .returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: user.id }],
      generatedMaps: [user],
      raw: [user],
    };

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateWorkingGroup(user.id, 'group1');

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual(user);
  });

  it('should throw an error when update working group fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentUserRepository.prototype, 'createQueryBuilder')
      .returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateWorkingGroup(user.id, 'group1');
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();
  });
});
