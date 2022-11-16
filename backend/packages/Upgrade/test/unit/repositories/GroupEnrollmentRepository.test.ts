import { SelectQueryBuilder } from 'typeorm';
import * as sinon from 'sinon';
import { GroupEnrollmentRepository } from '../../../src/api/repositories/GroupEnrollmentRepository';
import { GroupEnrollment } from '../../../src/api/models/GroupEnrollment';
import { Experiment } from '../../../src/api/models/Experiment';

let sandbox;
let createQueryBuilderStub;
let selectMock;
let selectQueryBuilder = new SelectQueryBuilder<GroupEnrollmentRepository>(null);
let repo = new GroupEnrollmentRepository();
const err = new Error('test error');

let group = new GroupEnrollment();
group.id = 'id1';
let exp = new Experiment();
exp.id = 'exp1';
group.experiment = exp;

beforeEach(() => {
  sandbox = sinon.createSandbox();

  selectMock = sandbox.mock(selectQueryBuilder);
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

    let res = await repo.findEnrollments([group.id], [exp.id]);

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

  it('should get enrollment count by condition', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    const result = [
      {
        id: exp.id,
        count: 40,
      },
    ];

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('groupBy').once().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.resolve(result));

    let res = await repo.getEnrollmentCountByCondition(exp.id);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when get enrollment count by condition fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(GroupEnrollmentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('where').once().returns(selectQueryBuilder);
    selectMock.expects('groupBy').once().returns(selectQueryBuilder);
    selectMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.getEnrollmentCountByCondition(exp.id);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });
});
