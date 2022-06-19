import { DeleteQueryBuilder, InsertQueryBuilder } from "typeorm";
import * as sinon from 'sinon';
import { ExplicitIndividualExclusionRepository } from "../../../src/api/repositories/ExplicitIndividualExclusionRepository";
import { ExplicitIndividualExclusion } from "../../../src/api/models/ExplicitIndividualExclusion";

let sandbox;
let createQueryBuilderStub;
let insertMock, deleteMock;
let insertQueryBuilder = new InsertQueryBuilder<ExplicitIndividualExclusionRepository>(null);
let deleteQueryBuilder = new DeleteQueryBuilder<ExplicitIndividualExclusionRepository>(null);
let repo = new ExplicitIndividualExclusionRepository();
const err =  new Error("test error")

let individual = new ExplicitIndividualExclusion();
individual.userId = 'id1';

beforeEach(() => {
    sandbox = sinon.createSandbox();

    insertMock = sandbox.mock(insertQueryBuilder);
    deleteMock = sandbox.mock(deleteQueryBuilder);
});

afterEach(() => {
    sandbox.restore();
});

describe('ExplicitIndividualExclusionRepository Testing', () => {

    it('should insert a new individual experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitIndividualExclusion').returns(insertQueryBuilder);
        const result =  {
            identifiers: [ { id: individual.userId } ],
            generatedMaps: [
                individual
            ],
            raw: [
                individual
            ]
          }

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.saveRawJson(individual);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();

        expect(res).toEqual([individual])

    });

    it('should throw an error when insert fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs('explicitIndividualExclusion').returns(insertQueryBuilder);

        insertMock.expects('insert').once().returns(insertQueryBuilder);
        insertMock.expects('into').once().returns(insertQueryBuilder);
        insertMock.expects('values').once().returns(insertQueryBuilder);
        insertMock.expects('onConflict').once().returns(insertQueryBuilder);
        insertMock.expects('returning').once().returns(insertQueryBuilder);
        insertMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.saveRawJson(individual)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        insertMock.verify();
    });

    it('should delete a individual experiment exclusion', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs().returns(deleteQueryBuilder);
        const result =  {
                identifiers: [ { id: individual.userId } ],
                generatedMaps: [
                    individual
                ],
                raw: [
                    individual
                ]
              }

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.resolve(result));

        let res = await repo.deleteById(individual.userId);

        sinon.assert.calledOnce(createQueryBuilderStub);
        deleteMock.verify();

        expect(res).toEqual([individual])

    });

    it('should throw an error when delete fails', async () => {
        createQueryBuilderStub = sandbox.stub(ExplicitIndividualExclusionRepository.prototype, 
            'createQueryBuilder').withArgs().returns(deleteQueryBuilder);

        deleteMock.expects('delete').once().returns(deleteQueryBuilder);
        deleteMock.expects('from').once().returns(deleteQueryBuilder);
        deleteMock.expects('where').once().returns(deleteQueryBuilder);
        deleteMock.expects('returning').once().returns(deleteQueryBuilder);
        deleteMock.expects('execute').once().returns(Promise.reject(err));

        expect(async() => {await repo.deleteById(individual.userId)}).rejects.toThrow(err);

        sinon.assert.calledOnce(createQueryBuilderStub);
        deleteMock.verify();

    });

})