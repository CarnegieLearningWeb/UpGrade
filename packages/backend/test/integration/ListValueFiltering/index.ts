import Container from 'typedi';
import {
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_STATE,
  EXPERIMENT_TYPE,
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  POST_EXPERIMENT_RULE,
  SEGMENT_TYPE,
} from 'upgrade_types';
import { Experiment } from '../../../src/api/models/Experiment';
import { ExperimentSegmentExclusion } from '../../../src/api/models/ExperimentSegmentExclusion';
import { ExperimentSegmentInclusion } from '../../../src/api/models/ExperimentSegmentInclusion';
import { FeatureFlag } from '../../../src/api/models/FeatureFlag';
import { FeatureFlagSegmentExclusion } from '../../../src/api/models/FeatureFlagSegmentExclusion';
import { FeatureFlagSegmentInclusion } from '../../../src/api/models/FeatureFlagSegmentInclusion';
import { GroupForSegment } from '../../../src/api/models/GroupForSegment';
import { IndividualForSegment } from '../../../src/api/models/IndividualForSegment';
import { Segment } from '../../../src/api/models/Segment';
import { FLAG_SEARCH_KEY } from '../../../src/api/controllers/validators/FeatureFlagsPaginatedParamsValidator';
import { SEGMENT_SEARCH_KEY } from '../../../src/api/controllers/validators/SegmentPaginatedParamsValidator';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { FeatureFlagService } from '../../../src/api/services/FeatureFlagService';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Container as typeOrmContainer } from '../../../src/typeorm-typedi-extensions';

export async function ListValueFiltering(): Promise<void> {
  const dataSource = typeOrmContainer.getDataSource();
  if (!dataSource) {
    throw new Error('Default data source is not available');
  }
  const context = 'home';

  const directExperimentList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Direct experiment list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Individual',
    tags: [],
  });
  const directFeatureFlagList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Direct feature flag list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Individual',
    tags: [],
  });
  const directSegmentList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Direct segment list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Individual',
    tags: [],
  });
  const directPublicSegment = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Direct public segment',
    description: '',
    context,
    type: SEGMENT_TYPE.PUBLIC,
    tags: [],
  });
  const nestedList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Nested list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'home-group1',
    tags: [],
  });
  const nestedExperimentList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Nested experiment list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Segment',
    tags: [],
  });
  const includeAllNestedExperimentList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Include-all nested experiment list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Segment',
    tags: [],
  });
  const activeNestedFeatureFlagList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Active nested feature flag list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Segment',
    tags: [],
  });
  const includeAllNestedFeatureFlagList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Include-all nested feature flag list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Segment',
    tags: [],
  });
  const disabledNestedFeatureFlagList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Disabled nested feature flag list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Segment',
    tags: [],
  });
  const nestedPublicSegment = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Nested public segment',
    description: '',
    context,
    type: SEGMENT_TYPE.PUBLIC,
    tags: [],
  });
  const nonmatchingExperimentList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Nonmatching experiment list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Individual',
    tags: [],
  });
  const nonmatchingFeatureFlagList = dataSource.getRepository(Segment).create({
    id: crypto.randomUUID(),
    name: 'Nonmatching feature flag list',
    description: '',
    context,
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Individual',
    tags: [],
  });

  await dataSource
    .getRepository(Segment)
    .save([
      directExperimentList,
      directFeatureFlagList,
      directSegmentList,
      directPublicSegment,
      nestedList,
      nestedExperimentList,
      includeAllNestedExperimentList,
      activeNestedFeatureFlagList,
      includeAllNestedFeatureFlagList,
      disabledNestedFeatureFlagList,
      nestedPublicSegment,
      nonmatchingExperimentList,
      nonmatchingFeatureFlagList,
    ]);
  await dataSource.getRepository(IndividualForSegment).save([
    { segmentId: directExperimentList.id, userId: 'CAPublicRe7EB2QN' },
    { segmentId: directFeatureFlagList.id, userId: 'CAPublicRe7EB2QN' },
    { segmentId: directSegmentList.id, userId: 'CAPublicRe7EB2QN' },
    { segmentId: nonmatchingExperimentList.id, userId: 'different-school-id' },
    { segmentId: nonmatchingFeatureFlagList.id, userId: 'different-school-id' },
  ]);
  await dataSource.getRepository(GroupForSegment).save({
    segmentId: nestedList.id,
    groupId: 'District-Alpha-9000',
    type: 'home-group1',
  });
  await dataSource.query(
    `INSERT INTO "segment_for_segment" ("childSegmentId", "parentSegmentId") VALUES
      ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10), ($11, $12), ($13, $14)`,
    [
      directSegmentList.id,
      directPublicSegment.id,
      nestedList.id,
      nestedPublicSegment.id,
      nestedPublicSegment.id,
      nestedExperimentList.id,
      nestedPublicSegment.id,
      includeAllNestedExperimentList.id,
      nestedPublicSegment.id,
      activeNestedFeatureFlagList.id,
      nestedPublicSegment.id,
      includeAllNestedFeatureFlagList.id,
      nestedPublicSegment.id,
      disabledNestedFeatureFlagList.id,
    ]
  );

  const experimentRepository = dataSource.getRepository(Experiment);
  const createExperiment = (name: string, filterMode = FILTER_MODE.EXCLUDE_ALL): Experiment =>
    experimentRepository.create({
      id: crypto.randomUUID(),
      name,
      description: '',
      context: [context],
      state: EXPERIMENT_STATE.INACTIVE,
      consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
      assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
      postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
      tags: [],
      filterMode,
      type: EXPERIMENT_TYPE.SIMPLE,
    });
  const directExperiment = createExperiment('Direct list experiment');
  const nestedExperiment = createExperiment('Nested list experiment', FILTER_MODE.INCLUDE_ALL);
  const includeAllNestedExperiment = createExperiment(
    'Include-all nested inclusion experiment',
    FILTER_MODE.INCLUDE_ALL
  );
  const nonmatchingExperiment = createExperiment('Nonmatching experiment');
  await experimentRepository.save([
    directExperiment,
    nestedExperiment,
    includeAllNestedExperiment,
    nonmatchingExperiment,
  ]);
  await dataSource.getRepository(ExperimentSegmentInclusion).save([
    { experimentId: directExperiment.id, segmentId: directExperimentList.id },
    { experimentId: includeAllNestedExperiment.id, segmentId: includeAllNestedExperimentList.id },
    { experimentId: nonmatchingExperiment.id, segmentId: nonmatchingExperimentList.id },
  ]);
  await dataSource.getRepository(ExperimentSegmentExclusion).save({
    experimentId: nestedExperiment.id,
    segmentId: nestedExperimentList.id,
  });

  const featureFlagRepository = dataSource.getRepository(FeatureFlag);
  const createFeatureFlag = (
    name: string,
    key: string,
    filterMode = FILTER_MODE.INCLUDE_ALL,
    status = FEATURE_FLAG_STATUS.ENABLED
  ): FeatureFlag =>
    featureFlagRepository.create({
      id: crypto.randomUUID(),
      name,
      key,
      description: '',
      context: [context],
      tags: [],
      status,
      filterMode,
    });
  const directFeatureFlag = createFeatureFlag('Direct list flag', 'DIRECT_LIST_FLAG');
  const disabledFeatureFlagWithActiveNestedList = createFeatureFlag(
    'Disabled flag with active nested list',
    'DISABLED_FLAG_ACTIVE_NESTED_LIST',
    FILTER_MODE.EXCLUDE_ALL,
    FEATURE_FLAG_STATUS.DISABLED
  );
  const includeAllNestedFeatureFlag = createFeatureFlag('Include-all nested list flag', 'INCLUDE_ALL_NESTED_LIST_FLAG');
  const enabledFeatureFlagWithDisabledNestedList = createFeatureFlag(
    'Enabled flag with disabled nested list',
    'ENABLED_FLAG_DISABLED_NESTED_LIST',
    FILTER_MODE.EXCLUDE_ALL
  );
  const nonmatchingFeatureFlag = createFeatureFlag('Nonmatching flag', 'NONMATCHING_FLAG', FILTER_MODE.EXCLUDE_ALL);
  await featureFlagRepository.save([
    directFeatureFlag,
    disabledFeatureFlagWithActiveNestedList,
    includeAllNestedFeatureFlag,
    enabledFeatureFlagWithDisabledNestedList,
    nonmatchingFeatureFlag,
  ]);
  await dataSource.getRepository(FeatureFlagSegmentExclusion).save({
    featureFlagId: directFeatureFlag.id,
    segmentId: directFeatureFlagList.id,
    enabled: false,
    listType: 'Individual',
  });
  await dataSource.getRepository(FeatureFlagSegmentInclusion).save([
    {
      featureFlagId: disabledFeatureFlagWithActiveNestedList.id,
      segmentId: activeNestedFeatureFlagList.id,
      enabled: true,
      listType: 'Segment',
    },
    {
      featureFlagId: includeAllNestedFeatureFlag.id,
      segmentId: includeAllNestedFeatureFlagList.id,
      enabled: true,
      listType: 'Segment',
    },
    {
      featureFlagId: enabledFeatureFlagWithDisabledNestedList.id,
      segmentId: disabledNestedFeatureFlagList.id,
      enabled: false,
      listType: 'Segment',
    },
    {
      featureFlagId: nonmatchingFeatureFlag.id,
      segmentId: nonmatchingFeatureFlagList.id,
      enabled: true,
      listType: 'Individual',
    },
  ]);

  const logger = new UpgradeLogger();
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const featureFlagService = Container.get<FeatureFlagService>(FeatureFlagService);
  const segmentService = Container.get<SegmentService>(SegmentService);

  const [directExperiments, directExperimentCount] = await experimentService.findPaginated(0, 20, logger, {
    key: EXPERIMENT_SEARCH_KEY.LIST_VALUE,
    string: 'publicRE7e',
  });
  expect(directExperimentCount).toBe(1);
  expect(directExperiments.map(({ id }) => id)).toEqual([directExperiment.id]);

  const [nestedExperiments, nestedExperimentCount] = await experimentService.findPaginated(0, 20, logger, {
    key: EXPERIMENT_SEARCH_KEY.ALL,
    string: 'ALPHA-9',
  });
  expect(nestedExperimentCount).toBe(1);
  expect(nestedExperiments.map(({ id }) => id)).toEqual([nestedExperiment.id]);

  const [directFeatureFlags, directFeatureFlagCount] = await featureFlagService.findPaginated(0, 20, logger, {
    key: FLAG_SEARCH_KEY.LIST_VALUE,
    string: 'publicRE7e',
  });
  expect(directFeatureFlagCount).toBe(1);
  expect(directFeatureFlags.map(({ id }) => id)).toEqual([directFeatureFlag.id]);

  const [nestedFeatureFlags, nestedFeatureFlagCount] = await featureFlagService.findPaginated(0, 20, logger, {
    key: FLAG_SEARCH_KEY.ALL,
    string: 'ALPHA-9',
  });
  expect(nestedFeatureFlagCount).toBe(2);
  expect(nestedFeatureFlags.map(({ id }) => id).sort()).toEqual(
    [disabledFeatureFlagWithActiveNestedList.id, enabledFeatureFlagWithDisabledNestedList.id].sort()
  );

  const [directSegments, directSegmentCount] = await segmentService.findPaginated(0, 20, logger, {
    key: SEGMENT_SEARCH_KEY.LIST_VALUE,
    string: 'publicRE7e',
  });
  expect(directSegmentCount).toBe(1);
  expect(directSegments.segmentsData.map(({ id }) => id)).toEqual([directPublicSegment.id]);

  const [nestedSegments, nestedSegmentCount] = await segmentService.findPaginated(0, 20, logger, {
    key: SEGMENT_SEARCH_KEY.ALL,
    string: 'ALPHA-9',
  });
  expect(nestedSegmentCount).toBe(1);
  expect(nestedSegments.segmentsData.map(({ id }) => id)).toEqual([nestedPublicSegment.id]);
}
