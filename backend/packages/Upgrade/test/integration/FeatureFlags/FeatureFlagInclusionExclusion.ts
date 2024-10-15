import { Container } from 'typedi';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { featureFlag } from '../mockData/featureFlag';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { FEATURE_FLAG_LIST_FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { RequestedExperimentUser } from 'src/api/controllers/validators/ExperimentUserValidator';
import { systemUser } from '../mockData/user';
import { UserService } from '../../../src/api/services/UserService';

export default async function FeatureFlagInclusionExclusionLogic(): Promise<void> {
  const featureFlagService = Container.get<FeatureFlagService>(FeatureFlagService);

  const featureFlagObject = featureFlag;
  const context = featureFlagObject.context;
  const key = featureFlagObject.key;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create feature flag
  const flag = await featureFlagService.create(featureFlagObject, user, new UpgradeLogger());

  const featureFlagSegmentInclusion = {
    flagId: flag.id,
    listType: 'group',
    enabled: true,
    segment: {
      name: 'Feature Flag 1 Inclusion Segment',
      description: 'Feature Flag 1 Inclusion Segment',
      context: 'home',
      type: SEGMENT_TYPE.PRIVATE,
      userIds: [],
      groups: [{ type: 'teacher', groupId: '1' }],
      subSegmentIds: [],
    },
  };

  const featureFlagSegmentExclusion = {
    flagId: flag.id,
    listType: 'individual',
    enabled: true,
    segment: {
      name: 'Feature Flag 1 Exclusion Segment',
      description: 'Feature Flag 1 Exclusion Segment',
      context: 'home',
      type: SEGMENT_TYPE.PRIVATE,
      userIds: ['student3'],
      groups: [],
      subSegmentIds: [],
    },
  };

  await featureFlagService.addList(
    [featureFlagSegmentExclusion],
    FEATURE_FLAG_LIST_FILTER_MODE.EXCLUSION,
    user,
    new UpgradeLogger()
  );
  await featureFlagService.addList(
    [featureFlagSegmentInclusion],
    FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION,
    user,
    new UpgradeLogger()
  );

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
    experimentUsers[0] as RequestedExperimentUser,
    context[0],
    new UpgradeLogger()
  );

  expect(keysAssign.length).toEqual(1);
  expect(keysAssign).toEqual(expect.arrayContaining([key]));

  // get keys for user2
  keysAssign = await featureFlagService.getKeys(
    experimentUsers[1] as RequestedExperimentUser,
    context[0],
    new UpgradeLogger()
  );

  expect(keysAssign.length).toEqual(1);
  expect(keysAssign).toEqual(expect.arrayContaining([key]));

  // get keys for user3
  keysAssign = await featureFlagService.getKeys(
    experimentUsers[2] as RequestedExperimentUser,
    context[0],
    new UpgradeLogger()
  );

  expect(keysAssign.length).toEqual(0);

  // Check the number of exposures
  const paginatedFind = await featureFlagService.findPaginated(0, 5, new UpgradeLogger());
  expect(paginatedFind[0].featureFlagExposures).toEqual(2);
}
