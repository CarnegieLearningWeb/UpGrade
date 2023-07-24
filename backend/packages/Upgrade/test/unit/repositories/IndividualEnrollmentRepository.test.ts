import { SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { IndividualEnrollment } from '../../../src/api/models/IndividualEnrollment';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';

let sandbox;
let createQueryBuilderStub;
let selectMock;
const selectQueryBuilder = new SelectQueryBuilder<IndividualEnrollmentRepository>(null);
const repo = new IndividualEnrollmentRepository();
const err = new Error('test error');

const individual = new IndividualEnrollment();
individual.id = 'id1';
const user = new ExperimentUser();
user.id = 'uid1';
const exp = new Experiment();
exp.id = 'exp1';
individual.experiment = exp;
individual.user = user;

beforeEach(() => {
  sandbox = sinon.createSandbox();

  selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('IndividualEnrollmentRepository Testing', () => {
  it('should delete a individual experiment enrollment', async () => {
    const result = {
      identifiers: [{ id: individual.id }],
      generatedMaps: [individual],
      raw: [individual],
    };
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'delete')
      .returns(Promise.resolve(result));

    const res = await repo.deleteEnrollmentsOfUserInExperiments(individual.id, [exp.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);

    expect(res).toEqual(result);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'delete')
      .returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteEnrollmentsOfUserInExperiments(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
  });

  it('should find enrollments', async () => {
    const result = {
      identifiers: [{ id: individual.id }],
      generatedMaps: [individual],
      raw: [individual],
    };
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'find')
      .returns(Promise.resolve(result));

    const res = await repo.findEnrollments(individual.id, [exp.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);

    expect(res).toEqual(result);
  });

  it('should throw an error when find enrollments fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'find')
      .returns(Promise.reject(err));

    expect(async () => {
      await repo.findEnrollments(individual.id, [exp.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
  });

  it('should get enrollment count for experiment', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    const result = [
      {
        id: exp.id,
        count: 40,
      },
    ];

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.getEnrollmentCountForExperiment(exp.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result[0].count);
  });

  it('should throw an error when get enrollment count for experiment fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(IndividualEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getEnrollmentCountForExperiment(exp.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
