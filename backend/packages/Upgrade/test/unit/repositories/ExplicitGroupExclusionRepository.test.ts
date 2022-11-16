import { DeleteQueryBuilder, InsertQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { ExplicitGroupExclusionRepository } from '../../../src/api/repositories/ExplicitGroupExclusionRepository';
import { ExplicitGroupExclusion } from '../../../src/api/models/ExplicitGroupExclusion';

let sandbox;
let createQueryBuilderStub;
let insertMock, deleteMock;
let insertQueryBuilder = new InsertQueryBuilder<ExplicitGroupExclusionRepository>(null);
let deleteQueryBuilder = new DeleteQueryBuilder<ExplicitGroupExclusionRepository>(null);
let repo = new ExplicitGroupExclusionRepository();
const err = new Error('test error');

let groupExclude = new ExplicitGroupExclusion();
groupExclude.id = 'id1';
groupExclude.groupId = 'groupid1';
groupExclude.type = 'schoolId';

beforeEach(() => {
  sandbox = sinon.createSandbox();

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('ExplicitGroupExclusionRepository Testing', () => {
  it('should insert a new group experiment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExplicitGroupExclusionRepository.prototype, 'createQueryBuilder')
      .withArgs('explicitGroupExclusion')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: groupExclude.id }],
      generatedMaps: [groupExclude],
      raw: [groupExclude],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    let res = await repo.saveRawJson(groupExclude);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([groupExclude]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExplicitGroupExclusionRepository.prototype, 'createQueryBuilder')
      .withArgs('explicitGroupExclusion')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.saveRawJson(groupExclude);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a group experiment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExplicitGroupExclusionRepository.prototype, 'createQueryBuilder')
      .withArgs()
      .returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: groupExclude.id }],
      generatedMaps: [groupExclude],
      raw: [groupExclude],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    let res = await repo.deleteGroup(groupExclude.groupId, groupExclude.type);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([groupExclude]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExplicitGroupExclusionRepository.prototype, 'createQueryBuilder')
      .withArgs()
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteGroup(groupExclude.groupId, groupExclude.type);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });
});
