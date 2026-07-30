import { DataSource } from 'typeorm';
import { DecisionPointRepository } from '../../../src/api/repositories/DecisionPointRepository';
import { DecisionPoint } from '../../../src/api/models/DecisionPoint';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';
import { EXPERIMENT_STATE } from 'upgrade_types';

let mock;
let manager;
let repo: DecisionPointRepository;
let dataSource: DataSource;
const err = new Error('test error');

const decisionPoint = new DecisionPoint();
decisionPoint.id = 'id1';
decisionPoint.excludeIfReached = true;

const result = {
  identifiers: [{ id: decisionPoint.id }],
  generatedMaps: [decisionPoint],
  raw: [decisionPoint],
};

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [DecisionPointRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(DecisionPointRepository);
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;

  manager = {
    createQueryBuilder: repo.createQueryBuilder,
    getRepository: jest.fn().mockReturnValue({ createQueryBuilder: repo.createQueryBuilder }),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('DecisionPointRepository Testing', () => {
  it('should upsert a new decision point', async () => {
    const res = await repo.upsertDecisionPoint(decisionPoint, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(decisionPoint);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual(decisionPoint);
  });

  it('should throw an error when upsert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.upsertDecisionPoint(decisionPoint, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith(decisionPoint);
    expect(mock.orUpdate).toHaveBeenCalledTimes(1);
    expect(mock.setParameter).toHaveBeenCalledTimes(4);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should insert new decision points', async () => {
    const res = await repo.insertDecisionPoint([decisionPoint], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([decisionPoint]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([decisionPoint]);
  });

  it('should throw an error when insert fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.insertDecisionPoint([decisionPoint], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.into).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledTimes(1);
    expect(mock.values).toHaveBeenCalledWith([decisionPoint]);
    expect(mock.returning).toHaveBeenCalledTimes(1);
    expect(mock.returning).toHaveBeenCalledWith('*');
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete decision points', async () => {
    const res = await repo.deleteByIds([decisionPoint.id], manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);

    expect(res).toEqual([decisionPoint]);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteByIds([decisionPoint.id], manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete an decision point', async () => {
    await repo.deleteDecisionPoint(decisionPoint.id, manager);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when delete fails', async () => {
    mock.execute.mockRejectedValue(err);

    expect(async () => {
      await repo.deleteDecisionPoint(decisionPoint.id, manager);
    }).rejects.toThrow(err);

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.delete).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.execute).toHaveBeenCalledTimes(1);
  });

  it('should get decision point and name', async () => {
    mock.getMany.mockResolvedValue([decisionPoint, decisionPoint]);
    const res = await repo.partitionPointAndName();

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);

    expect(res).toEqual([decisionPoint, decisionPoint]);
  });

  it('should throw an error when get decision point and name fails', async () => {
    mock.getMany.mockRejectedValue(err);

    expect(async () => {
      await repo.partitionPointAndName();
    }).rejects.toThrow(err);

    expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(mock.select).toHaveBeenCalledTimes(1);
    expect(mock.getMany).toHaveBeenCalledTimes(1);
  });

  it('should get distinct non-archived experiment usage counts for each decision point in an experiment', async () => {
    const usageCounts = [{ decisionPointId: decisionPoint.id, usedByCount: 2 }];
    mock.getRawMany.mockResolvedValue(usageCounts);

    const res = await repo.getUsageCountsForExperiment('experiment-1');

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('sourceDecisionPoint');
    expect(mock.select).toHaveBeenCalledWith('sourceDecisionPoint.id', 'decisionPointId');
    expect(mock.addSelect).toHaveBeenCalledWith('COUNT(DISTINCT usedByExperiment.id)::int', 'usedByCount');
    expect(mock.leftJoin).toHaveBeenNthCalledWith(
      1,
      DecisionPoint,
      'usedByDecisionPoint',
      expect.stringContaining('COALESCE(usedByDecisionPoint.target')
    );
    expect(mock.leftJoin).toHaveBeenNthCalledWith(
      2,
      'usedByDecisionPoint.experiment',
      'usedByExperiment',
      'usedByExperiment.state != :archivedState',
      { archivedState: EXPERIMENT_STATE.ARCHIVED }
    );
    expect(mock.where).toHaveBeenCalledWith('"sourceDecisionPoint"."experimentId" = :experimentId', {
      experimentId: 'experiment-1',
    });
    expect(mock.groupBy).toHaveBeenCalledWith('sourceDecisionPoint.id');
    expect(mock.getRawMany).toHaveBeenCalledTimes(1);
    expect(res).toEqual(usageCounts);
  });

  it('should use the provided entity manager to get decision point usage counts within a transaction', async () => {
    mock.getRawMany.mockResolvedValue([]);

    await repo.getUsageCountsForExperiment('experiment-1', manager);

    expect(manager.getRepository).toHaveBeenCalledWith(DecisionPoint);
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('sourceDecisionPoint');
  });

  it('should throw an error when getting decision point usage counts fails', async () => {
    mock.getRawMany.mockRejectedValue(err);

    await expect(repo.getUsageCountsForExperiment('experiment-1')).rejects.toThrow(err);
  });

  describe('setAllPendingActivationFalse', () => {
    it('should set pendingActivation to false for all DPs using entityManager', async () => {
      await repo.setAllPendingActivationFalse('experiment-1', manager);

      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mock.update).toHaveBeenCalledTimes(1);
      expect(mock.update).toHaveBeenCalledWith(DecisionPoint);
      expect(mock.set).toHaveBeenCalledTimes(1);
      expect(mock.set).toHaveBeenCalledWith({ pendingActivation: false });
      expect(mock.where).toHaveBeenCalledTimes(1);
      expect(mock.where).toHaveBeenCalledWith('"experimentId" = :experimentId', { experimentId: 'experiment-1' });
      expect(mock.execute).toHaveBeenCalledTimes(1);
    });

    it('should set pendingActivation to false using repo createQueryBuilder when no entityManager', async () => {
      await repo.setAllPendingActivationFalse('experiment-1');

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mock.update).toHaveBeenCalledTimes(1);
      expect(mock.update).toHaveBeenCalledWith(DecisionPoint);
      expect(mock.set).toHaveBeenCalledWith({ pendingActivation: false });
      expect(mock.where).toHaveBeenCalledWith('"experimentId" = :experimentId', { experimentId: 'experiment-1' });
      expect(mock.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw when execute fails', async () => {
      mock.execute.mockRejectedValue(err);

      await expect(repo.setAllPendingActivationFalse('experiment-1', manager)).rejects.toThrow();

      expect(mock.update).toHaveBeenCalledTimes(1);
      expect(mock.set).toHaveBeenCalledWith({ pendingActivation: false });
      expect(mock.execute).toHaveBeenCalledTimes(1);
    });
  });
});
