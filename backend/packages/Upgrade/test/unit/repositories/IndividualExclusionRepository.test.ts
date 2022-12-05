import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { IndividualExclusion } from '../../../src/api/models/IndividualExclusion';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';

let sandbox;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<IndividualExclusionRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<IndividualExclusionRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<IndividualExclusionRepository>(null);
const repo = new IndividualExclusionRepository();
const err = new Error('test error');

const individual = new IndividualExclusion();
individual.id = 'id1';
const user = new ExperimentUser();
user.id = 'uid1';
const exp = new Experiment();
exp.id = 'exp1';
individual.experiment = exp;
individual.user = user;

beforeEach(() => {
  sandbox = sinon.createSandbox();

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('IndividualExclusionRepository Testing', () => {
  it('should insert a new individual experiment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: individual.id }],
      generatedMaps: [individual],
      raw: [individual],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.saveRawJson([individual]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([individual]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.saveRawJson([individual]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a individual experiment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: individual.id }],
      generatedMaps: [individual],
      raw: [individual],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('whereInIds').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteExperimentsForUserId(individual.id, [exp.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([individual]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('whereInIds').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteExperimentsForUserId(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should determine if user is excluded from experiment', async () => {
    createQueryBuilderStub = sandbox.stub(IndividualExclusionRepository.prototype, 'count').returns(Promise.resolve(1));

    const res = await repo.isUserExcludedFromExperiment(individual.id, exp.id);

    sinon.assert.calledOnce(createQueryBuilderStub);

    expect(res).toEqual(true);
  });

  it('should throw an error when count fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'count')
      .returns(Promise.reject(err));

    expect(async () => {
      await repo.isUserExcludedFromExperiment(individual.id, exp.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
  });

  it('should find excluded users', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    const result = {
      identifiers: [{ id: individual.id }],
      generatedMaps: [individual],
      raw: [individual],
    };

    selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('whereInIds').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findExcluded(individual.id, [exp.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('whereInIds').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findExcluded(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should find excluded users by experiment Id', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: individual.id }],
      generatedMaps: [individual],
      raw: [individual],
    };

    selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findExcludedByExperimentId(exp.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find excluded users by experiment Id fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findExcludedByExperimentId(exp.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
