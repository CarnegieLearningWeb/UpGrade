import { Service } from 'typedi';
import {
  IFeatureFlagSearchParams,
  IFeatureFlagSortParams,
} from '../../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { FeatureFlagValidation } from '../../../../src/api/controllers/validators/FeatureFlagValidator';
import { RequestedExperimentUser } from '../../../../src/api/controllers/validators/ExperimentUserValidator';
import { FeatureFlagListValidator } from '../../../../src/api/controllers/validators/FeatureFlagListValidator';

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

  public getKeys(experimentUser: RequestedExperimentUser, context: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public create(flagDTO: FeatureFlagValidation, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public updateState(flagId: string, status: boolean, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public updateFilterMode(flagId: string, filterMode: boolean, logger: UpgradeLogger): Promise<[]> {
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

  // eslint-disable-next-line @typescript-eslint/ban-types
  public addList(listInput: FeatureFlagListValidator[], filterType: string, logger: UpgradeLogger): Promise<{}[]> {
    return Promise.resolve([{}]);
  }

  public deleteList(segmentId: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
