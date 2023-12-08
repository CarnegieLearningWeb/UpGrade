// import { SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { GroupEnrollmentRepository } from '../../../src/api/repositories/GroupEnrollmentRepository';
import { GroupEnrollment } from '../../../src/api/models/GroupEnrollment';
import { Experiment } from '../../../src/api/models/Experiment';

let sandbox;
let createQueryBuilderStub;
// const selectQueryBuilder = new SelectQueryBuilder<GroupEnrollmentRepository>(null);
const repo = new GroupEnrollmentRepository();
const err = new Error('test error');

const group = new GroupEnrollment();
group.id = 'id1';
const exp = new Experiment();
exp.id = 'exp1';
group.experiment = exp;

beforeEach(() => {
  sandbox = sinon.createSandbox();

  // selectMock = sandbox.mock(selectQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('GroupEnrollmentRepository Testing', () => {
  it('should find enrollments', async () => {
    const result = {
      identifiers: [{ id: group.id }],
      generatedMaps: [group],
      raw: [group],
    };
    createQueryBuilderStub = sandbox.stub(GroupEnrollmentRepository.prototype, 'find').returns(Promise.resolve(result));

    const res = await repo.findEnrollments([group.id], [exp.id]);

    sinon.assert.calledOnce(createQueryBuilderStub);

    expect(res).toEqual(result);
  });

  it('should throw an error when find enrollments fails', async () => {
    createQueryBuilderStub = sandbox.stub(GroupEnrollmentRepository.prototype, 'find').returns(Promise.reject(err));

    expect(async () => {
      await repo.findEnrollments([group.id], [exp.id]);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
  });
});
