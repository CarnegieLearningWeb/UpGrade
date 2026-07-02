import { Container } from 'typedi';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { featureFlag } from '../mockData/featureFlag';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { LIST_FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
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
    id: flag.id,
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
    id: flag.id,
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
    LIST_FILTER_MODE.EXCLUSION,
    user,
    new UpgradeLogger()
  );
  await featureFlagService.addList(
    [featureFlagSegmentInclusion],
    LIST_FILTER_MODE.INCLUSION,
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
  // getKeys fire-and-forgets the exposure insert, so poll until the writes land in the DB
  let paginatedFind = await featureFlagService.findPaginated(0, 5, new UpgradeLogger());
  for (let i = 0; i < 10 && (paginatedFind[0][0] as any).featureFlagExposures < 2; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    paginatedFind = await featureFlagService.findPaginated(0, 5, new UpgradeLogger());
  }
  expect(paginatedFind[0][0].featureFlagExposures).toEqual(2);

  // --- Details view (findOneForDetails): returns member counts, not the member lists ---
  const detailsFlag = await featureFlagService.findOneForDetails(flag.id, new UpgradeLogger());
  const detailsInclusionSegment = detailsFlag.featureFlagSegmentInclusion[0].segment;
  const detailsExclusionSegment = detailsFlag.featureFlagSegmentExclusion[0].segment;
  // inclusion list has one group and no individuals; exclusion list has one individual
  expect(detailsInclusionSegment.groupForSegmentCount).toEqual(1);
  expect(detailsInclusionSegment.individualForSegmentCount).toEqual(0);
  expect(detailsExclusionSegment.individualForSegmentCount).toEqual(1);
  // the counts-only view must not load the (potentially huge) member arrays
  expect(detailsInclusionSegment.groupForSegment).toBeUndefined();
  expect(detailsExclusionSegment.individualForSegment).toBeUndefined();

  // --- getSegmentByIdWithMembers: returns a private list together with its members ---
  const segmentService = Container.get<SegmentService>(SegmentService);
  const inclusionSegmentId = detailsInclusionSegment.id;
  const segmentWithMembers = await segmentService.getSegmentByIdWithMembers(inclusionSegmentId, new UpgradeLogger());
  expect(segmentWithMembers).toBeTruthy();
  expect(segmentWithMembers.type).toEqual(SEGMENT_TYPE.PRIVATE);
  expect(segmentWithMembers.groupForSegment.length).toEqual(1);
  // the plain getSegmentById excludes private lists — which is exactly why /members exists
  const publicOnlyLookup = await segmentService.getSegmentById(inclusionSegmentId, new UpgradeLogger());
  expect(publicOnlyLookup).toBeFalsy();

  // --- updateListStatus: toggles enabled without rewriting the segment's members ---
  const toggledRecord = await featureFlagService.updateListStatus(
    inclusionSegmentId,
    false,
    LIST_FILTER_MODE.INCLUSION,
    user,
    new UpgradeLogger()
  );
  expect(toggledRecord.enabled).toEqual(false);
  const flagAfterToggle = await featureFlagService.findOne(flag.id, new UpgradeLogger());
  const inclusionAfterToggle = flagAfterToggle.featureFlagSegmentInclusion.find(
    (inclusion) => inclusion.segment.id === inclusionSegmentId
  );
  expect(inclusionAfterToggle.enabled).toEqual(false);
  expect(inclusionAfterToggle.segment.groupForSegment.length).toEqual(1);
}
