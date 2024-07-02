import Container from 'typedi';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { featureFlag } from '../mockData/featureFlag';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { ExperimentUser } from 'src/api/models/ExperimentUser';
import { SEGMENT_TYPE } from '../../../../../../types/src';

export default async function FeatureFlagInclusionExclusionLogic(): Promise<void> {
  const featureFlagService = Container.get<FeatureFlagService>(FeatureFlagService);
  const segmentService = Container.get<SegmentService>(SegmentService);

  const featureFlagObject = featureFlag;
  const context = featureFlagObject.context;
  const key = featureFlagObject.key;

  // create feature flag
  const flag = await featureFlagService.create(featureFlagObject, new UpgradeLogger());

  const featureFlagSegmentInclusion = {
    id: '2b0c0200-7a15-4e19-8688-f9ac283f18aa',
    name: 'Feature Flag 1 Inclusion Segment',
    description: 'Feature Flag 1 Inclusion Segment',
    context: 'home',
    type: SEGMENT_TYPE.PRIVATE,
    userIds: ['student1'],
    groups: [{ type: 'teacher', groupId: '1' }],
    subSegmentIds: [],
    includedInFeatureFlag: flag,
  };

  const featureFlagSegmentExclusion = {
    id: '3b0c0200-7a15-4e19-8688-f9ac283f18aa',
    name: 'Feature Flag 1 Exclusion Segment',
    description: 'Feature Flag 1 Exclusion Segment',
    context: 'home',
    type: SEGMENT_TYPE.PRIVATE,
    userIds: ['student3'],
    groups: [],
    subSegmentIds: [],
    excludedFromFeatureFlag: flag,
  };

  await segmentService.upsertSegment(featureFlagSegmentExclusion, new UpgradeLogger());
  await segmentService.upsertSegment(featureFlagSegmentInclusion, new UpgradeLogger());

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
