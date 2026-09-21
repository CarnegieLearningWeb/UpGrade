import {
  LIST_VALUE_SEARCH_PATTERN_PARAMETER,
  buildListValueSearchPattern,
  getListValueSearchPredicate,
  isListValueSearchKey,
} from '../../../src/api/services/listValueSearchHelpers';

describe('list value search helpers', () => {
  it('builds a literal partial-match pattern', () => {
    expect(buildListValueSearchPattern('School%_Id\\Value')).toBe('%School\\%\\_Id\\\\Value%');
  });

  it('matches individual and group IDs case-insensitively', () => {
    const predicate = getListValueSearchPredicate('segment');

    expect(predicate).toContain(`"userId" ILIKE :${LIST_VALUE_SEARCH_PATTERN_PARAMETER} ESCAPE '\\'`);
    expect(predicate).toContain(`"groupId" ILIKE :${LIST_VALUE_SEARCH_PATTERN_PARAMETER} ESCAPE '\\'`);
  });

  it('recursively walks from matching segments to ancestors with cycle-safe UNION semantics', () => {
    const predicate = getListValueSearchPredicate('segment');

    expect(predicate).toContain('WITH RECURSIVE "directListValueSegments"');
    expect(predicate).toContain('INNER JOIN "matchingListValueSegments" "matchedSegment"');
    expect(predicate).toContain('ON "segmentRelation"."childSegmentId" = "matchedSegment"."id"');
    expect(predicate).toContain('SELECT "segmentRelation"."parentSegmentId" AS "id"');
    expect(predicate).not.toContain('UNION ALL\n    SELECT "segmentRelation"."parentSegmentId"');
  });

  it('matches experiments through inclusion and exclusion lists', () => {
    const predicate = getListValueSearchPredicate('experiment');

    expect(predicate).toContain('experiment.id IN (');
    expect(predicate).toContain('FROM "experiment_segment_inclusion"');
    expect(predicate).toContain('FROM "experiment_segment_exclusion"');
    expect(predicate).toContain('INNER JOIN "experiment" "listValueOwner"');
    expect(predicate).toContain('ON "listValueOwner".id = "listValueInclusion"."experimentId"');
    expect(predicate).not.toContain('EXISTS (');
    expect(predicate).not.toContain('"enabled"');
    expect(predicate).toContain(`"listValueOwner"."filterMode" <> 'includeAll'`);
  });

  it('matches feature flags through attached lists regardless of list enabled state', () => {
    const predicate = getListValueSearchPredicate('featureFlag');

    expect(predicate).toContain('feature_flag.id IN (');
    expect(predicate).toContain('FROM "feature_flag_segment_inclusion"');
    expect(predicate).toContain('FROM "feature_flag_segment_exclusion"');
    expect(predicate).toContain('INNER JOIN "feature_flag" "listValueOwner"');
    expect(predicate).toContain('ON "listValueOwner".id = "listValueInclusion"."featureFlagId"');
    expect(predicate).not.toContain('EXISTS (');
    expect(predicate).not.toContain('"enabled"');
    expect(predicate).toContain(`"listValueOwner"."filterMode" <> 'includeAll'`);
  });

  it('only identifies list-value and all-search keys as list-value searches', () => {
    expect(isListValueSearchKey('listValue')).toBe(true);
    expect(isListValueSearchKey('all')).toBe(true);
    expect(isListValueSearchKey('name')).toBe(false);
  });
});
