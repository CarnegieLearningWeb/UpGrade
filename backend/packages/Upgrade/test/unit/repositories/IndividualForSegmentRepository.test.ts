import {
  Connection,
  ConnectionManager,
  DeleteQueryBuilder,
  EntityManager,
  InsertQueryBuilder,
  SelectQueryBuilder,
} from 'typeorm';
import * as sinon from 'sinon';
import { IndividualForSegmentRepository } from '../../../src/api/repositories/IndividualForSegmentRepository';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<IndividualForSegmentRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<IndividualForSegmentRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<IndividualForSegmentRepository>(null);
const repo = new IndividualForSegmentRepository();
const err = new Error('test error');
const logger = new UpgradeLogger();

const segment = new IndividualForSegment();
segment.userId = 'id1';

const result = {
  identifiers: [{ id: segment.userId }],
  generatedMaps: [segment],
  raw: [segment],
};

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(IndividualForSegmentRepository.prototype);

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

describe('IndividualForSegmentRepository Testing', () => {
  it('should insert a new individual for segment', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertIndividualForSegment([segment], manager, logger);

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
      await repo.insertIndividualForSegment([segment], manager, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete an individual segment', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteIndividualForSegment('segment1', segment.userId, logger);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([segment]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteIndividualForSegment('segment1', segment.userId, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should delete an individual for segment by id', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteIndividualForSegmentById(segment.userId, logger);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([segment]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteIndividualForSegmentById(segment.userId, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should get individual for segment by id', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock
      .expects('getMany')
      .once()
      .returns(Promise.resolve([segment, segment]));

    const res = await repo.getIndividualForSegmentById(segment.userId, logger);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual([segment, segment]);
  });

  it('should throw an error when get individual for segment by id fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getIndividualForSegmentById(segment.userId, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
