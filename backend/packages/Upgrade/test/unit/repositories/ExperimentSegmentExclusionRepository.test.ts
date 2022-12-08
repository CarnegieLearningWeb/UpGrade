import {
  Connection,
  ConnectionManager,
  DeleteQueryBuilder,
  EntityManager,
  InsertQueryBuilder,
  SelectQueryBuilder,
} from 'typeorm';
import * as sinon from 'sinon';
import { ExperimentSegmentExclusionRepository } from '../../../src/api/repositories/ExperimentSegmentExclusionRepository';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Segment } from '../../../src/api/models/Segment';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<ExperimentSegmentExclusionRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<ExperimentSegmentExclusionRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<ExperimentSegmentExclusionRepository>(null);
const repo = new ExperimentSegmentExclusionRepository();
const err = new Error('test error');
const logger = new UpgradeLogger();

const segment = new Segment();
segment.id = 'id1';

const result = {
  identifiers: [{ id: segment.id }],
  generatedMaps: [segment],
  raw: [segment],
};

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(ExperimentSegmentExclusionRepository.prototype);

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

describe('ExperimentSegmentExclusionRepository Testing', () => {
  it('should insert a segment exclusion', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertData(segment, logger, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([segment]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertData(segment, logger, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a segment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentSegmentExclusionRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteData(segment.id, 'exp1', logger);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([segment]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentSegmentExclusionRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteData(segment.id, 'exp1', logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should get a segment exclusion', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentSegmentExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('addSelect').exactly(4).returns(selectQueryBuilder);
    selectMock
      .expects('getMany')
      .once()
      .returns(Promise.resolve([segment, segment]));

    const res = await repo.getExperimentSegmentExclusionData();

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual([segment, segment]);
  });

  it('should throw an error when get segment exclusion fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentSegmentExclusionRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoin').twice().returns(selectQueryBuilder);
    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('addSelect').exactly(4).returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getExperimentSegmentExclusionData();
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
