import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder } from "typeorm";
import * as sinon from 'sinon';
import { ExplicitExperimentIndividualExclusionRepository } from "../../../src/api/repositories/ExplicitExperimentIndividualExclusionRepository";
import { UpgradeLogger } from "../../../src/lib/logger/UpgradeLogger";
import { Experiment } from "../../../src/api/models/Experiment";

let sandbox;
let createQueryBuilderStub;
let insertMock, selectMock, deleteMock;
let insertQueryBuilder = new InsertQueryBuilder<ExplicitExperimentIndividualExclusionRepository>(null);
let selectQueryBuilder = new SelectQueryBuilder<ExplicitExperimentIndividualExclusionRepository>(null);
let deleteQueryBuilder = new DeleteQueryBuilder<ExplicitExperimentIndividualExclusionRepository>(null);
let repo = new ExplicitExperimentIndividualExclusionRepository();
let logger = new UpgradeLogger();
const err =  new Error("test error")

let exp = new Experiment();
exp.id = 'exp1'

let excludeData =[
        {
            "userId": "user1",
            "experiment": exp
        },
        {
            "userId": "user2",
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

describe('ExplicitExperimentIndividualExclusionRepository Testing', () => {

    it('should insert a new group experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualExclusion').returns(insertQueryBuilder);
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

        let res = await repo.insertExplicitExperimentIndividualExclusion(excludeData, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([excludeData])

    });

    it('should throw an error when insert fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualExclusion').returns(insertQueryBuilder);

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.insertExplicitExperimentIndividualExclusion(excludeData, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

    it('should delete a group experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
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

        let res = await repo.deleteById(excludeData[0].userId, excludeData[0].experiment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([excludeData])

    });

    it('should throw an error when delete fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs().returns(deleteQueryBuilder);

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.deleteById(excludeData[0].userId, excludeData[0].experiment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

    });

    it('should find all group experiment exclusions', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualExclusion').returns(selectQueryBuilder);
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

        let res = await repo.findAllUsers(logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual(result)

    });

    it('should throw an error when find all group experiment exclusions fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualExclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('getMany').once().returns(Promise.reject(err));

        expect(async() => {await repo.findAllUsers(logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

    });

    it('should find one group experiment exclusion by id', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualExclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('andWhere').twice().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.resolve(excludeData[0]));

        let res = await repo.findOneById(excludeData[0].userId, excludeData[0].experiment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual(excludeData[0])

    });

    it('should throw an error when find one fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualExclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('andWhere').twice().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.reject(err));

        expect(async() => {await repo.findOneById(excludeData[0].userId, excludeData[0].experiment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

})