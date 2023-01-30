import {
  Connection,
  ConnectionManager,
  DeleteQueryBuilder,
  EntityManager,
  InsertQueryBuilder,
  SelectQueryBuilder,
} from 'typeorm';
import * as sinon from 'sinon';
import { GroupForSegmentRepository } from '../../../src/api/repositories/GroupForSegmentRepository';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { GroupForSegment } from '../../../src/api/models/GroupForSegment';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
const insertQueryBuilder = new InsertQueryBuilder<GroupForSegmentRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<GroupForSegmentRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<GroupForSegmentRepository>(null);
const repo = new GroupForSegmentRepository();
const err = new Error('test error');
const logger = new UpgradeLogger();

const segment = new GroupForSegment();
segment.groupId = 'id1';
segment.type = 'schoolId';

const result = {
  identifiers: [{ id: segment.groupId }],
  generatedMaps: [segment],
  raw: [segment],
};

beforeEach(() => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(GroupForSegmentRepository.prototype);

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

describe('GroupForSegmentRepository Testing', () => {
  it('should insert a new group for segment', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('onConflict').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertGroupForSegment([segment], manager, logger);

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
      await repo.insertGroupForSegment([segment], manager, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete a group segment', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteGroupForSegment('segment1', segment.groupId, segment.type, logger);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([segment]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteGroupForSegment('segment1', segment.groupId, segment.type, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should delete a group for segment by id', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteGroupForSegmentById(segment.groupId, logger);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([segment]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteGroupForSegmentById(segment.groupId, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should get group for segment by id', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock
      .expects('getMany')
      .once()
      .returns(Promise.resolve([segment, segment]));

    const res = await repo.getGroupForSegmentById(segment.groupId, logger);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual([segment, segment]);
  });

  it('should throw an error when get group for segment by id fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupForSegmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getGroupForSegmentById(segment.groupId, logger);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
