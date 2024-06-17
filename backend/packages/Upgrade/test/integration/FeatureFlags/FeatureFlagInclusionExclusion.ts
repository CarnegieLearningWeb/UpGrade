import Container from 'typedi';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { featureFlag } from '../mockData/featureFlag';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { ExperimentUser } from 'src/api/models/ExperimentUser';

export default async function FeatureFlagInclusionExclusionLogic(): Promise<void> {
  const featureFlagService = Container.get<FeatureFlagService>(FeatureFlagService);

  const featureFlagObject = featureFlag;
  const context = featureFlagObject.context;
  const key = featureFlagObject.key;

  // create feature flag
  await featureFlagService.create(featureFlagObject, new UpgradeLogger());
  const featureFlags = await featureFlagService.find(new UpgradeLogger());

  expect(featureFlags.length).toEqual(1);
  expect(featureFlags).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: featureFlagObject.name,
        key: featureFlagObject.key,
        description: featureFlagObject.description,
        status: featureFlagObject.status,
        context: featureFlagObject.context,
        tags: featureFlagObject.tags,
        filterMode: featureFlagObject.filterMode,
      }),
    ])
  );

  // get keys for user1
  let keysAssign = await featureFlagService.getKeys(
    experimentUsers[0] as ExperimentUser,
    context[0],
    new UpgradeLogger()
  );

  expect(keysAssign.length).toEqual(1);
  expect(keysAssign).toEqual(expect.arrayContaining([key]));

  // get keys for user2
  keysAssign = await featureFlagService.getKeys(experimentUsers[1] as ExperimentUser, context[0], new UpgradeLogger());

  expect(keysAssign.length).toEqual(1);
  expect(keysAssign).toEqual(expect.arrayContaining([key]));

  // get keys for user3
  keysAssign = await featureFlagService.getKeys(experimentUsers[2] as ExperimentUser, context[0], new UpgradeLogger());

  expect(keysAssign.length).toEqual(0);
}
