import { FILTER_MODE } from 'upgrade_types';

export const LIST_VALUE_SEARCH_PATTERN_PARAMETER = 'listValueSearchPattern';

export type ListValueSearchTarget = 'experiment' | 'featureFlag' | 'segment';

const matchingSegmentIdsQuery = `
  WITH RECURSIVE "directListValueSegments" AS (
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
  )
  SELECT "id"
  FROM "matchingListValueSegments"
`;

const ownerSearchConfig = {
  experiment: {
    ownerAlias: 'experiment',
    ownerIdColumn: 'experimentId',
    inclusionTable: 'experiment_segment_inclusion',
    exclusionTable: 'experiment_segment_exclusion',
  },
  featureFlag: {
    ownerAlias: 'feature_flag',
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
    return `segment.id IN (${matchingSegmentIdsQuery})`;
  }

  const config = ownerSearchConfig[target];
  return `EXISTS (
    SELECT 1
    FROM (
      SELECT "segmentId", "${config.ownerIdColumn}" AS "ownerId",
        TRUE AS "isInclusion"
      FROM "${config.inclusionTable}"
      UNION ALL
      SELECT "segmentId", "${config.ownerIdColumn}" AS "ownerId",
        FALSE AS "isInclusion"
      FROM "${config.exclusionTable}"
    ) "attachedList"
    WHERE "attachedList"."ownerId" = ${config.ownerAlias}.id
      AND (
        "attachedList"."isInclusion" = FALSE
        OR ${config.ownerAlias}."filterMode" <> '${FILTER_MODE.INCLUDE_ALL}'
      )
      AND "attachedList"."segmentId" IN (${matchingSegmentIdsQuery})
  )`;
}
