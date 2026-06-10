import { DataSource } from 'typeorm';
import { FeatureFlagExposureRepository } from '../../../src/api/repositories/FeatureFlagExposureRepository';
import { FeatureFlagExposure } from '../../../src/api/models/FeatureFlagExposure';
import { Container } from '../../../src/typeorm-typedi-extensions';
import { initializeMocks } from '../mockdata/mockRepo';

let mock;
let dataSource: DataSource;
let repo: FeatureFlagExposureRepository;

const result = {
  identifiers: [],
  generatedMaps: [],
  raw: [],
};

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
  const commonMockData = initializeMocks(result);
  repo.createQueryBuilder = commonMockData.createQueryBuilder;
  mock = commonMockData.mocks;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('FeatureFlagExposureRepository Testing', () => {
  describe('recordExposureIfNotExists', () => {
    it('should insert all flagId/userId pairs using orIgnore for duplicate handling', async () => {
      const flagIds = ['flag-id-1', 'flag-id-2'];
      const userId = 'user-id-1';

      await repo.recordExposureIfNotExists(flagIds, userId);

      expect(repo.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mock.insert).toHaveBeenCalledTimes(1);
      expect(mock.into).toHaveBeenCalledWith(FeatureFlagExposure);
      expect(mock.values).toHaveBeenCalledWith([
        { featureFlagId: 'flag-id-1', experimentUserId: 'user-id-1' },
        { featureFlagId: 'flag-id-2', experimentUserId: 'user-id-1' },
      ]);
      expect(mock.orIgnore).toHaveBeenCalledTimes(1);
      expect(mock.execute).toHaveBeenCalledTimes(1);
    });

    it('should work for a single flag', async () => {
      const flagIds = ['flag-id-1'];
      const userId = 'user-id-1';

      await repo.recordExposureIfNotExists(flagIds, userId);

      expect(mock.values).toHaveBeenCalledWith([{ featureFlagId: 'flag-id-1', experimentUserId: 'user-id-1' }]);
      expect(mock.orIgnore).toHaveBeenCalledTimes(1);
      expect(mock.execute).toHaveBeenCalledTimes(1);
    });
  });
});
