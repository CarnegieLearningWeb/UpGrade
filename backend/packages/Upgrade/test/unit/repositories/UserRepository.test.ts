import { DeleteQueryBuilder, InsertQueryBuilder, UpdateQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { UserRepository } from '../../../src/api/repositories/UserRepository';
import { User } from '../../../src/api/models/User';
import { UserRole } from 'upgrade_types';

let sandbox;
let createQueryBuilderStub;
let insertMock, deleteMock, updateMock;
const insertQueryBuilder = new InsertQueryBuilder<UserRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<UserRepository>(null);
const updateQueryBuilder = new UpdateQueryBuilder<UserRepository>(null);

const repo = new UserRepository();
const err = new Error('test error');

const individual = new User();
individual.email = 'email@test.com';
individual.firstName = 'first';
individual.lastName = 'last';
individual.role = UserRole.ADMIN;
individual.localTimeZone = 'Asia/Kolkata';

beforeEach(() => {
  sandbox = sinon.createSandbox();

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  updateMock = sandbox.mock(updateQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('UserRepository Testing', () => {
  it('should upsert a new user', async () => {
    createQueryBuilderStub = sandbox.stub(UserRepository.prototype, 'createQueryBuilder').returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: individual.email }],
      generatedMaps: [individual],
      raw: [individual],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(4).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.upsertUser(individual);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual(individual);
  });

  it('should throw an error when upsert fails', async () => {
    createQueryBuilderStub = sandbox.stub(UserRepository.prototype, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('setParameter').exactly(4).returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.upsertUser(individual);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should update user details', async () => {
    createQueryBuilderStub = sandbox
      .stub(UserRepository.prototype, 'createQueryBuilder')
      .withArgs('user')
      .returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: individual.email }],
      generatedMaps: [individual],
      raw: [individual],
    };

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateUserDetails(
      individual.firstName,
      individual.lastName,
      individual.email,
      individual.role
    );

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual([individual]);
  });

  it('should throw an error when update user details fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(UserRepository.prototype, 'createQueryBuilder')
      .withArgs('user')
      .returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateUserDetails(individual.firstName, individual.lastName, individual.email, individual.role);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();
  });

  it('should delete a user', async () => {
    createQueryBuilderStub = sandbox.stub(UserRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: individual.email }],
      generatedMaps: [individual],
      raw: [individual],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteUserByEmail(individual.email);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([individual]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox.stub(UserRepository.prototype, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteUserByEmail(individual.email);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });
});
