import { User } from 'aws-sdk/clients/appstream';
import { Service } from 'typedi';
import {
  IFeatureFlagSearchParams,
  IFeatureFlagSortParams,
} from '../../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { FeatureFlag } from '../../../../src/api/models/FeatureFlag';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class FeatureFlagServiceMock {
  public find(): Promise<[]> {
    return Promise.resolve([]);
  }
  public findPaginated(
    skip: number,
    take: number,
    logger: UpgradeLogger,
    searchParams?: IFeatureFlagSearchParams,
    sortParams?: IFeatureFlagSortParams
  ): Promise<[]> {
    return Promise.resolve([]);
  }

  public create(flag: FeatureFlag, currentUser: User, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public updateState(flagId: string, status: boolean, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public getTotalCount(): Promise<[]> {
    return Promise.resolve([]);
  }
  public delete(featureFlagId: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
  public update(id: string, flag: FeatureFlag, currentUser: User, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
