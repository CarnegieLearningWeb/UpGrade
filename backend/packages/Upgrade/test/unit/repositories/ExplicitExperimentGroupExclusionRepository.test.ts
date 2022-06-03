import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder } from "typeorm";
import * as sinon from 'sinon';
import { ExplicitExperimentGroupExclusionRepository } from "../../../src/api/repositories/ExplicitExperimentGroupExclusionRepository";
import { UpgradeLogger } from "../../../src/lib/logger/UpgradeLogger";
import { Experiment } from "../../../src/api/models/Experiment";

let sandbox;
let createQueryBuilderStub;
let insertMock, selectMock, deleteMock;
let insertQueryBuilder = new InsertQueryBuilder<ExplicitExperimentGroupExclusionRepository>(null);
let selectQueryBuilder = new SelectQueryBuilder<ExplicitExperimentGroupExclusionRepository>(null);
let deleteQueryBuilder = new DeleteQueryBuilder<ExplicitExperimentGroupExclusionRepository>(null);
let repo = new ExplicitExperimentGroupExclusionRepository();
let logger = new UpgradeLogger();
const err =  new Error("test error")

let exp = new Experiment();
exp.id = 'exp1'

let excludeData =[
        {
            "type": "schoolId",
            "groupId": "sch1",
            "experiment": exp
        },
        {
            "type": "schoolId",
            "groupId": "sch2",
            "experiment": exp
        }
    ]

beforeEach(() => {
    sandbox = sinon.createSandbox();

    insertMock = sandbox.mock(insertQueryBuilder);
    selectMock = sandbox.mock(selectQueryBuilder);
    deleteMock = sandbox.mock(deleteQueryBuilder);
});

afterEach(() => {
    sandbox.restore();
});

describe('ExplicitExperimentGroupExclusionRepository Testing', () => {

    it('should insert a new group experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('ExplicitExperimentGroupExclusion').returns(insertQueryBuilder);
        const result =  {
            identifiers: [ { experiment: excludeData[0].experiment } ],
            generatedMaps: [
              excludeData
            ],
            raw: [
              excludeData
            ]
          }

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.insertExplicitExperimentGroupExclusion(excludeData, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([excludeData])

    });

    it('should throw an error when insert fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('ExplicitExperimentGroupExclusion').returns(insertQueryBuilder);

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.insertExplicitExperimentGroupExclusion(excludeData, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

    it('should delete a group experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs().returns(deleteQueryBuilder);
        const result =  {
            identifiers: [ { experiment: excludeData[0].experiment } ],
            generatedMaps: [
              excludeData
            ],
            raw: [
              excludeData
            ]
          }

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.deleteGroup(excludeData[0].groupId, excludeData[0].type, excludeData[0].experiment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([excludeData])

    });

    it('should throw an error when delete fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs().returns(deleteQueryBuilder);

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.deleteGroup(excludeData[0].groupId, excludeData[0].type, excludeData[0].experiment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

    });

    it('should find all group experiment exclusions', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentGroupExclusion').returns(selectQueryBuilder);
        const result =  {
            identifiers: [ { experiment: excludeData[0].experiment } ],
            generatedMaps: [
              excludeData
            ],
            raw: [
              excludeData
            ]
          }

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('getMany').once().returns(Promise.resolve(result));

        let res = await repo.findAllGroups(logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual(result)

    });

    it('should throw an error when find all group experiment exclusions fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentGroupExclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('getMany').once().returns(Promise.reject(err));

        expect(async() => {await repo.findAllGroups(logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

    });

    it('should find one group experiment exclusion by id', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentGroupExclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('andWhere').twice().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.resolve(excludeData[0]));

        let res = await repo.findOneById(excludeData[0].type, excludeData[0].groupId, excludeData[0].experiment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual(excludeData[0])

    });

    it('should throw an error when find one fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentGroupExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentGroupExclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('andWhere').twice().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.reject(err));

        expect(async() => {await repo.findOneById(excludeData[0].type, excludeData[0].groupId, excludeData[0].experiment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

})