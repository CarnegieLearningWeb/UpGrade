import { DataSource, In } from 'typeorm';
import { FeatureFlagExposureRepository } from '../../../src/api/repositories/FeatureFlagExposureRepository';
import { FeatureFlagExposureCount } from '../../../src/api/models/FeatureFlagExposureCount';
import { Container } from '../../../src/typeorm-typedi-extensions';

let dataSource: DataSource;
let repo: FeatureFlagExposureRepository;

beforeAll(() => {
  dataSource = new DataSource({
    type: 'postgres',
    database: 'postgres',
    entities: [FeatureFlagExposureRepository],
    synchronize: true,
  });
  Container.setDataSource('default', dataSource);
});

beforeEach(() => {
  repo = Container.getCustomRepository(FeatureFlagExposureRepository);
  jest.spyOn(repo.manager, 'query').mockResolvedValue([]);
  jest.spyOn(repo.manager, 'findBy').mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('FeatureFlagExposureRepository Testing', () => {
  describe('recordExposureIfNotExists', () => {
    it('should insert new exposures and increment their flag counts in one statement', async () => {
      const flagIds = ['flag-id-1', 'flag-id-2'];
      const userId = 'user-id-1';

      await repo.recordExposureIfNotExists(flagIds, userId);

      expect(repo.manager.query).toHaveBeenCalledTimes(1);
      const [sql, params] = (repo.manager.query as jest.Mock).mock.calls[0];
      expect(params).toEqual([flagIds, userId]);
      // Only exposures that didn't exist yet are returned and counted
      expect(sql).toContain('INSERT INTO "feature_flag_exposure"');
      expect(sql).toContain('ON CONFLICT DO NOTHING');
      expect(sql).toContain('RETURNING "featureFlagId"');
      // ...and are added to the existing per-flag count, in a consistent lock order
      expect(sql).toContain('INSERT INTO "feature_flag_exposure_count"');
      expect(sql).toContain('ORDER BY "featureFlagId"');
      expect(sql).toContain('"count" = "feature_flag_exposure_count"."count" + EXCLUDED."count"');
    });

    it('should not query when there are no flags', async () => {
      await repo.recordExposureIfNotExists([], 'user-id-1');

      expect(repo.manager.query).not.toHaveBeenCalled();
    });
  });

  describe('getExposureCountsByFlagIds', () => {
    it('should return counts keyed by flag id', async () => {
      (repo.manager.findBy as jest.Mock).mockResolvedValue([
        { featureFlagId: 'flag-id-1', count: 42 },
        { featureFlagId: 'flag-id-2', count: 7 },
      ]);

      const counts = await repo.getExposureCountsByFlagIds(['flag-id-1', 'flag-id-2', 'flag-id-3']);

      expect(repo.manager.findBy).toHaveBeenCalledWith(FeatureFlagExposureCount, {
        featureFlagId: In(['flag-id-1', 'flag-id-2', 'flag-id-3']),
      });
      expect(counts).toEqual(
        new Map([
          ['flag-id-1', 42],
          ['flag-id-2', 7],
        ])
      );
    });

    it('should not query when there are no flags', async () => {
      const counts = await repo.getExposureCountsByFlagIds([]);

      expect(repo.manager.findBy).not.toHaveBeenCalled();
      expect(counts.size).toBe(0);
    });
  });
});
