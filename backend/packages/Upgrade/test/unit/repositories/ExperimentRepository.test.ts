import {
  Connection,
  ConnectionManager,
  DeleteQueryBuilder,
  EntityManager,
  InsertQueryBuilder,
  SelectQueryBuilder,
  UpdateQueryBuilder,
} from 'typeorm';
import * as sinon from 'sinon';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { Experiment } from '../../../src/api/models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import * as globalExcludeSegment from '../../../src/init/seed/globalExcludeSegment';

let sandbox;
let connection;
let manager;
let createQueryBuilderStub;
let insertMock, deleteMock, selectMock, updateMock;
const insertQueryBuilder = new InsertQueryBuilder<ExperimentRepository>(null);
const deleteQueryBuilder = new DeleteQueryBuilder<ExperimentRepository>(null);
const selectQueryBuilder = new SelectQueryBuilder<ExperimentRepository>(null);
const updateQueryBuilder = new UpdateQueryBuilder<ExperimentRepository>(null);
const repo = new ExperimentRepository();
const err = new Error('test error');

const experiment = new Experiment();
experiment.id = 'id1';

beforeEach(async () => {
  sandbox = sinon.createSandbox();

  const repocallback = sinon.stub();
  repocallback.returns(ExperimentRepository.prototype);

  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    getRepository: repocallback,
  } as unknown as Connection);

  connection = sinon.createStubInstance(Connection);
  manager = new EntityManager(connection);

  insertMock = sandbox.mock(insertQueryBuilder);
  deleteMock = sandbox.mock(deleteQueryBuilder);
  selectMock = sandbox.mock(selectQueryBuilder);
  updateMock = sandbox.mock(updateQueryBuilder);
});

afterEach(() => {
  sandbox.restore();
});

describe('ExperimentRepository Testing', () => {
  it('should insert a new experiment', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: experiment.id }],
      generatedMaps: [experiment],
      raw: [experiment],
    };
    

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertExperiment(experiment, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when insert fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertExperiment(experiment, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should insert a batch of new experiment', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);
    const result = {
      identifiers: [{ id: experiment.id }],
      generatedMaps: [experiment],
      raw: [experiment],
    };

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.insertBatchExps([experiment], manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when insert batch fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(insertQueryBuilder);

    insertMock.expects('insert').once().returns(insertQueryBuilder);
    insertMock.expects('into').once().returns(insertQueryBuilder);
    insertMock.expects('values').once().returns(insertQueryBuilder);
    insertMock.expects('returning').once().returns(insertQueryBuilder);
    insertMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.insertBatchExps([experiment], manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    insertMock.verify();
  });

  it('should delete an experiment', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);
    const result = {
      identifiers: [{ id: experiment.id }],
      generatedMaps: [experiment],
      raw: [experiment],
    };

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.deleteById(experiment.id, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when delete fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(deleteQueryBuilder);

    deleteMock.expects('delete').once().returns(deleteQueryBuilder);
    deleteMock.expects('from').once().returns(deleteQueryBuilder);
    deleteMock.expects('where').once().returns(deleteQueryBuilder);
    deleteMock.expects('returning').once().returns(deleteQueryBuilder);
    deleteMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.deleteById(experiment.id, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    deleteMock.verify();
  });

  it('should find all experiments', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = [experiment];

    selectMock.expects('leftJoinAndSelect').exactly(12).returns(selectQueryBuilder);
    selectMock.expects('leftJoinAndSelect').exactly(10).returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findAllExperiments();

    sinon.assert.calledTwice(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error when find all experiments fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').exactly(22).returns(selectQueryBuilder);
    selectMock.expects('getMany').twice().returns(Promise.reject(err));

    expect(async () => {
      await repo.findAllExperiments();
    }).rejects.toThrow(err);

    sinon.assert.calledTwice(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should find all experiments by name', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = {
      identifiers: [{ id: experiment.id }],
      generatedMaps: [experiment],
      raw: [experiment],
    };

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.resolve(result));

    const res = await repo.findAllName();

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error find all experiments by name fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('select').once().returns(selectQueryBuilder);
    selectMock.expects('getMany').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.findAllName();
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should get valid experiments', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = [experiment];

    selectMock.expects('leftJoinAndSelect').exactly(22).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('getMany').twice().returns(Promise.resolve(result));

    const res = await repo.getValidExperiments('context');

    sinon.assert.calledTwice(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error get valid experiments fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').exactly(22).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('getMany').twice().returns(Promise.reject(err));

    expect(async () => {
      await repo.getValidExperiments('context');
    }).rejects.toThrow(err);

    sinon.assert.calledTwice(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should get valid experiments with preview', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);
    const result = [experiment];

    selectMock.expects('leftJoinAndSelect').exactly(22).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('getMany').twice().returns(Promise.resolve(result));

    const res = await repo.getValidExperimentsWithPreview('context');

    sinon.assert.calledTwice(createQueryBuilderStub);
    selectMock.verify();

    expect(res).toEqual(result);
  });

  it('should throw an error get valid experiments with preview fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(selectQueryBuilder);

    selectMock.expects('leftJoinAndSelect').exactly(22).returns(selectQueryBuilder);
    selectMock.expects('where').twice().returns(selectQueryBuilder);
    selectMock.expects('getMany').twice().returns(Promise.reject(err));

    expect(async () => {
      await repo.getValidExperimentsWithPreview('context');
    }).rejects.toThrow(err);

    sinon.assert.calledTwice(createQueryBuilderStub);
    selectMock.verify();
  });

  it('should update experiment state', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: experiment.id }],
      generatedMaps: [experiment],
      raw: [experiment],
    };

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'));

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when update state fails', async () => {
    createQueryBuilderStub = sandbox
      .stub(ExperimentRepository.prototype, 'createQueryBuilder')
      .returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'));
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();
  });

  it('should update experiment state with manager', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: experiment.id }],
      generatedMaps: [experiment],
      raw: [experiment],
    };

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'), manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when update state with manager fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, new Date('1-19-2022'), manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();
  });

  it('should update experiment', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(updateQueryBuilder);
    const result = {
      identifiers: [{ id: experiment.id }],
      generatedMaps: [experiment],
      raw: [experiment],
    };

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.resolve(result));

    const res = await repo.updateExperiment(experiment, manager);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();

    expect(res).toEqual([experiment]);
  });

  it('should throw an error when update experiment fails', async () => {
    createQueryBuilderStub = sandbox.stub(manager, 'createQueryBuilder').returns(updateQueryBuilder);

    updateMock.expects('update').once().returns(updateQueryBuilder);
    updateMock.expects('set').once().returns(updateQueryBuilder);
    updateMock.expects('where').once().returns(updateQueryBuilder);
    updateMock.expects('returning').once().returns(updateQueryBuilder);
    updateMock.expects('execute').once().returns(Promise.reject(err));

    expect(async () => {
      await repo.updateExperiment(experiment, manager);
    }).rejects.toThrow(err);

    sinon.assert.calledOnce(createQueryBuilderStub);
    updateMock.verify();
  });

  it('should clear the database', async () => {
    const entities = [
      {
        tableName: 'user',
        name: 'user',
      },
      {
        tableName: 'Experiment',
        name: 'Experiment',
      },
    ];
    manager.connection = connection;
    connection.entityMetadatas = entities;
    connection.getRepository = sandbox.stub().returns(ExperimentRepository.prototype);

    const queryStub = sandbox.stub(ExperimentRepository.prototype, 'query').returns(Promise.resolve());

    const segStub = sandbox.stub(globalExcludeSegment, 'createGlobalExcludeSegment').returns(Promise.resolve());

    const res = await repo.clearDB(manager, new UpgradeLogger());

    sinon.assert.calledOnce(queryStub);
    sinon.assert.calledOnce(segStub);

    expect(res).toBeUndefined();
  });

  it('should throw an error when clear the database fails', async () => {
    const entities = [
      {
        tableName: 'user',
        name: 'user',
      },
      {
        tableName: 'Experiment',
        name: 'Experiment',
      },
    ];
    manager.connection = connection;
    connection.entityMetadatas = entities;
    connection.getRepository = sandbox.stub().returns(ExperimentRepository.prototype);
    sandbox.stub(ExperimentRepository.prototype, 'query').returns(Promise.reject(err));

    expect(async () => {
      await repo.clearDB(manager, new UpgradeLogger());
    }).rejects.toThrow('test error');
  });
});
