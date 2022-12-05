import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { GroupExclusion } from '../../../src/api/models/GroupExclusion';
import { Experiment } from '../../../src/api/models/Experiment';

let sandbox;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<GroupExclusionRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<GroupExclusionRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<GroupExclusionRepository>(null);
const repo = new GroupExclusionRepository();
const err = new Error('test error');

const group = new GroupExclusion();
group.id = 'id1';
const exp = new Experiment();
exp.id = 'exp1';
group.experiment = exp;

beforeEach(() => {
  sandbox = sinon.createSandbox();

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('GroupExclusionRepository Testing', () => {
  it('should insert a new group experiment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: group.id }],
      generatedMaps: [group],
      raw: [group],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson([group]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([group]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.saveRawJson([group]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a group experiment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: group.id }],
      generatedMaps: [group],
      raw: [group],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteByExperimentIds([exp.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([group]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteByExperimentIds([exp.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should determine if user is excluded from experiment', async () => {
    createQueryBuilderStub = sandbox.stub(GroupExclusionRepository.prototype, 'count').returns(Promise.resolve(1));

    const res = await repo.isGroupExcludedFromExperiment(group.id, exp.id);

    sinon.assert.calledOnce(createQueryBuilderStub);

    expect(res).toEqual(true);
  });

  it('should throw an error when count fails', async () => {
    createQueryBuilderStub = sandbox.stub(GroupExclusionRepository.prototype, 'count').returns(Promise.reject(err));

    expect(async () => {
      await repo.isGroupExcludedFromExperiment(group.id, exp.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
  });

  it('should find excluded users', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    const result = {
      identifiers: [{ id: group.id }],
      generatedMaps: [group],
      raw: [group],
    };

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('whereInIds').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findExcluded([group.id], [exp.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('whereInIds').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findExcluded([group.id], [exp.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should find excluded users by experiment Id', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: group.id }],
      generatedMaps: [group],
      raw: [group],
    };

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findExcludedByExperimentId(exp.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users by experiment Id fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findExcludedByExperimentId(exp.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
