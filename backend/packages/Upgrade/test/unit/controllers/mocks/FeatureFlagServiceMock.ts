import { Service } from 'typedi';
import {
  IFeatureFlagSearchParams,
  IFeatureFlagSortParams,
} from '../../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { FeatureFlagValidation } from 'src/api/controllers/validators/FeatureFlagValidator';

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

  public create(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<[]> {
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
  public update(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
