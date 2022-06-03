import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder } from "typeorm";
import * as sinon from 'sinon';
import { ExplicitExperimentIndividualInclusionRepository } from "../../../src/api/repositories/ExplicitExperimentIndividualInclusionRepository";
import { UpgradeLogger } from "../../../src/lib/logger/UpgradeLogger";
import { Experiment } from "../../../src/api/models/Experiment";

let sandbox;
let createQueryBuilderStub;
let insertMock, selectMock, deleteMock;
let insertQueryBuilder = new InsertQueryBuilder<ExplicitExperimentIndividualInclusionRepository>(null);
let selectQueryBuilder = new SelectQueryBuilder<ExplicitExperimentIndividualInclusionRepository>(null);
let deleteQueryBuilder = new DeleteQueryBuilder<ExplicitExperimentIndividualInclusionRepository>(null);
let repo = new ExplicitExperimentIndividualInclusionRepository();
let logger = new UpgradeLogger();
const err =  new Error("test error")

let exp = new Experiment();
exp.id = 'exp1'

let includeData =[
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

describe('ExplicitExperimentIndividualInclusionRepository Testing', () => {

    it('should insert a new group experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualInclusion').returns(insertQueryBuilder);
        const result =  {
            identifiers: [ { experiment: includeData[0].experiment } ],
            generatedMaps: [
              includeData
            ],
            raw: [
              includeData
            ]
          }

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.insertExplicitExperimentIndividualInclusion(includeData, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([includeData])

    });

    it('should throw an error when insert fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualInclusion').returns(insertQueryBuilder);

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.insertExplicitExperimentIndividualInclusion(includeData, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

    it('should delete a group experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs().returns(deleteQueryBuilder);
        const result =  {
            identifiers: [ { experiment: includeData[0].experiment } ],
            generatedMaps: [
              includeData
            ],
            raw: [
              includeData
            ]
          }

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.deleteById(includeData[0].userId, includeData[0].experiment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([includeData])

    });

    it('should throw an error when delete fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs().returns(deleteQueryBuilder);

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.deleteById(includeData[0].userId, includeData[0].experiment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

    });

    it('should find all group experiment exclusions', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualInclusion').returns(selectQueryBuilder);
        const result =  {
            identifiers: [ { experiment: includeData[0].experiment } ],
            generatedMaps: [
              includeData
            ],
            raw: [
              includeData
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
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualInclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('getMany').once().returns(Promise.reject(err));

        expect(async() => {await repo.findAllUsers(logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

    });

    it('should find one group experiment exclusion by id', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualInclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('andWhere').twice().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.resolve(includeData[0]));

        let res = await repo.findOneById(includeData[0].userId, includeData[0].experiment.id, logger);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual(includeData[0])

    });

    it('should throw an error when find one fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitExperimentIndividualInclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitExperimentIndividualInclusion').returns(selectQueryBuilder);

        selectMock.expects('leftJoinAndSelect').once().returns(selectQueryBuilder);
        selectMock.expects('where').once().returns(selectQueryBuilder);
        selectMock.expects('andWhere').twice().returns(selectQueryBuilder);
        selectMock.expects('getOne').once().returns(Promise.reject(err));

        expect(async() => {await repo.findOneById(includeData[0].userId, includeData[0].experiment.id, logger)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

})