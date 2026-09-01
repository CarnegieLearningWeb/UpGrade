import { FILTER_MODE } from 'upgrade_types';

export const LIST_VALUE_SEARCH_PATTERN_PARAMETER = 'listValueSearchPattern';

export type ListValueSearchTarget = 'experiment' | 'featureFlag' | 'segment';

const matchingSegmentIdsCte = `WITH RECURSIVE "directListValueSegments" AS (
    SELECT "segmentId" AS "id"
    FROM "individual_for_segment"
    WHERE "userId" ILIKE :${LIST_VALUE_SEARCH_PATTERN_PARAMETER} ESCAPE '\\'
    UNION
    SELECT "segmentId" AS "id"
    FROM "group_for_segment"
    WHERE "groupId" ILIKE :${LIST_VALUE_SEARCH_PATTERN_PARAMETER} ESCAPE '\\'
  ),
  "matchingListValueSegments" AS (
    SELECT "id"
    FROM "directListValueSegments"
    UNION
    SELECT "segmentRelation"."parentSegmentId" AS "id"
    FROM "segment_for_segment" "segmentRelation"
    INNER JOIN "matchingListValueSegments" "matchedSegment"
      ON "segmentRelation"."childSegmentId" = "matchedSegment"."id"
  )`;

const ownerSearchConfig = {
  experiment: {
    ownerAlias: 'experiment',
    ownerTable: 'experiment',
    ownerIdColumn: 'experimentId',
    inclusionTable: 'experiment_segment_inclusion',
    exclusionTable: 'experiment_segment_exclusion',
  },
  featureFlag: {
    ownerAlias: 'feature_flag',
    ownerTable: 'feature_flag',
    ownerIdColumn: 'featureFlagId',
    inclusionTable: 'feature_flag_segment_inclusion',
    exclusionTable: 'feature_flag_segment_exclusion',
  },
} as const;

export function buildListValueSearchPattern(searchString: string): string {
  const escapedSearchString = searchString.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  return `%${escapedSearchString}%`;
}

export function isListValueSearchKey(searchKey: string): boolean {
  return searchKey === 'all' || searchKey === 'listValue';
}

export function getListValueSearchPredicate(target: ListValueSearchTarget): string {
  if (target === 'segment') {
    return `segment.id IN (
    ${matchingSegmentIdsCte}
    SELECT "id"
    FROM "matchingListValueSegments"
  )`;
  }

  const config = ownerSearchConfig[target];
  // Include All makes inclusion lists inapplicable. Feature flag list enabled state is intentionally
  // ignored because this search discovers attached configuration, not assignment eligibility.
  return `${config.ownerAlias}.id IN (
    ${matchingSegmentIdsCte}
    SELECT "listValueInclusion"."${config.ownerIdColumn}"
    FROM "${config.inclusionTable}" "listValueInclusion"
    INNER JOIN "${config.ownerTable}" "listValueOwner"
      ON "listValueOwner".id = "listValueInclusion"."${config.ownerIdColumn}"
    WHERE "listValueOwner"."filterMode" <> '${FILTER_MODE.INCLUDE_ALL}'
      AND "listValueInclusion"."segmentId" IN (
        SELECT "id"
        FROM "matchingListValueSegments"
      )
    UNION
    SELECT "listValueExclusion"."${config.ownerIdColumn}"
    FROM "${config.exclusionTable}" "listValueExclusion"
    WHERE "listValueExclusion"."segmentId" IN (
      SELECT "id"
      FROM "matchingListValueSegments"
    )
  )`;
}
