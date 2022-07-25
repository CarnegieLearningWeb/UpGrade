import { Connection, ConnectionManager, DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder } from "typeorm";
import * as sinon from 'sinon';
import { SegmentRepository } from "../../../src/api/repositories/SegmentRepository";
import { Segment } from "../../../src/api/models/Segment";
import { UpgradeLogger } from "../../../src/lib/logger/UpgradeLogger";

let sandbox;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock;
let insertQueryBuilder = new InsertQueryBuilder<SegmentRepository>(null);
let deleteQueryBuilder = new DeleteQueryBuilder<SegmentRepository>(null);
let selectQueryBuilder = new SelectQueryBuilder<SegmentRepository>(null);
let repo = new SegmentRepository();
const err =  new Error("test error")
let logger = new UpgradeLogger()

let segment = new Segment();
segment.id = 'id1';

const result =  {
    identifiers: [ { id: segment.id } ],
    generatedMaps: [
        segment
    ],
    raw: [
        segment
    ]
  }

beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    const repocallback = sinon.stub()
    repocallback.returns(SegmentRepository.prototype)

    sandbox.stub(ConnectionManager.prototype, 'get').returns({
        getRepository: repocallback
    } as unknown as Connection)
    
    insertMock = sandbox.mock(insertQueryBuilder);
    deleteMock = sandbox.mock(deleteQueryBuilder);
    selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
    sandbox.restore();
});

describe('SegmentRepository Testing', () => {


    it('should upsert a new segment', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(insertQueryBuilder);
        

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('setParameter').exactly(3).returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.upsertSegment(segment, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual(segment)

    });

    it('should throw an error when upsert fails', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(insertQueryBuilder);

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('setParameter').exactly(3).returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.upsertSegment(segment, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

    it('should insert a new segment', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(insertQueryBuilder);

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.insertSegment(segment, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([segment])

    });

    it('should throw an error when insert fails', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(insertQueryBuilder);

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.insertSegment(segment, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

    it('should delete segment', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(deleteQueryBuilder);

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.deleteSegment(segment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        deleteMock.verify();

        expect(res).toEqual([segment])
    });

    it('should throw an error when delete fails', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(deleteQueryBuilder);

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.deleteSegment(segment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        deleteMock.verify();

    });

    it('should get all segments', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
        selectMock.expects('getMany').once().returns(Promise.resolve([segment, segment]));

        let res = await repo.getAllSegments(logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        selectMock.verify();

        expect(res).toEqual([segment, segment])
    });

    it('should throw an error when get all segments fails', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').twice().returns(selectQueryBuilder);
        selectMock.expects('getMany').once().returns(Promise.reject(err));

        expect(async() => {await repo.getAllSegments(logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        selectMock.verify();

    });

    it('should get segment by id', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(selectQueryBuilder);

        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.resolve([segment, segment]));

        let res = await repo.getSegmentById(segment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        selectMock.verify();

        expect(res).toEqual([segment, segment])
    });

    it('should throw an error when get segment by id fails', async () => {
        createQueryBuilderStub = sandbox.stub(SegmentRepository.prototype, 
            'createQueryBuilder').returns(selectQueryBuilder);

        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.reject(err));

        expect(async() => {await repo.getSegmentById(segment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        selectMock.verify();

    });


})