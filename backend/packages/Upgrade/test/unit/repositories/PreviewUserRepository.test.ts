import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { PreviewUserRepository } from '../../../src/api/repositories/PreviewUserRepository';
import { PreviewUser } from '../../../src/api/models/PreviewUser';

let sandbox;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<PreviewUserRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<PreviewUserRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<PreviewUserRepository>(null);
const repo = new PreviewUserRepository();
const err = new Error('test error');

const user = new PreviewUser();
user.id = 'id1';

beforeEach(() => {
  sandbox = sinon.createSandbox();

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('PreviewUserRepository Testing', () => {
  it('should insert a new preview user', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: user.id }],
      generatedMaps: [user],
      raw: [user],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson(user);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([user]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.saveRawJson(user);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a preview user', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: user.id }],
      generatedMaps: [user],
      raw: [user],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteById(user.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([user]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteById(user.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should find user by id', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: user.id }],
      generatedMaps: [user],
      raw: [user],
    };

    selectMock.expects('innerJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('addSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getOne').once().returns(Promise.resolve(result));

    const res = await repo.findOneById(user.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find user by id fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .withArgs('user')
      .returns(selectQueryBuilder);

    selectMock.expects('innerJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('addSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getOne').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findOneById(user.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should find with names', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .withArgs('user')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: user.id }],
      generatedMaps: [user],
      raw: [user],
    };

    selectMock.expects('innerJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('addSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findWithNames();

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find with names fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .withArgs('user')
      .returns(selectQueryBuilder);

    selectMock.expects('innerJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('innerJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('addSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findWithNames();
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should find paginated', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .withArgs('user')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: user.id }],
      generatedMaps: [user],
      raw: [user],
    };

    selectMock.expects('skip').once().returns(selectQueryBuilder);
    selectMock.expects('take').once().returns(selectQueryBuilder);
    selectMock.expects('orderBy').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findPaginated(1, 1);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find paginated fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(PreviewUserRepository.prototype, 'createQueryBuilder')
      .withArgs('user')
      .returns(selectQueryBuilder);

    selectMock.expects('skip').once().returns(selectQueryBuilder);
    selectMock.expects('take').once().returns(selectQueryBuilder);
    selectMock.expects('orderBy').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findPaginated(1, 1);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
