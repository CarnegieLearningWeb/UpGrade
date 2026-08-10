import { SegmentRepository } from '../repositories/SegmentRepository';

// Group IDs are stored namespaced with their group type in the same flat arrays as bare individual
// user IDs. This (a) prevents a group ID from ever colliding with an individual user ID that happens
// to share the same string, and (b) keeps matching type-aware, matching the experiment / on-the-fly
// resolution path (see ExperimentAssignmentService.inclusionExclusionLogic). Both the write path
// (flattenSegmentMembers) and the read paths (FeatureFlagService / ExperimentAssignmentService) MUST
// compose the key with this same helper. The type is recoverable by splitting on the FIRST
// delimiter — group types (e.g. 'schoolId') never contain ':', though group IDs may.
export const PRECOMPUTED_GROUP_DELIMITER = ':';
export function precomputedGroupKey(type: string, groupId: string): string {
  return `${type}${PRECOMPUTED_GROUP_DELIMITER}${groupId}`;
}

/** The shape both precomputed-segment entities share; all the read paths need from a row. */
interface PrecomputedMemberIds {
  inclusionIds: string[];
  exclusionIds: string[];
}

export interface PrecomputedMemberSets {
  inclusionSet: Set<string>;
  exclusionSet: Set<string>;
}

// Precomputed rows come out of the in-memory cache, which hands the same object to every request.
// Building `new Set(row.inclusionIds)` inside a read path therefore costs O(members) CPU per request
// over data that only changes on recompute — and a single flag can carry >100k member IDs. Memoize
// the Set views against the row object so that cost is paid once per row instead.
//
// A WeakMap keyed on the row is what makes this safe: a recompute produces a *new* row object (a
// fresh query result, cached under the same key), so it gets fresh Sets rather than stale ones, and
// the superseded entry is collected along with the old row. Never mutate a row's ID arrays in place
// — replace the row — or the memoized Sets will drift from it.
const memberSetsByRow = new WeakMap<PrecomputedMemberIds, PrecomputedMemberSets>();

export function getPrecomputedMemberSets(row: PrecomputedMemberIds): PrecomputedMemberSets {
  let sets = memberSetsByRow.get(row);
  if (!sets) {
    sets = { inclusionSet: new Set(row.inclusionIds), exclusionSet: new Set(row.exclusionIds) };
    memberSetsByRow.set(row, sets);
  }
  return sets;
}

/**
 * Recursively flatten a set of segments into a flat array of member IDs: individual user IDs bare,
 * group IDs namespaced via precomputedGroupKey, recursing into sub-segments. `seen` guards against
 * cycles and repeated sub-segments. Shared by the feature-flag and experiment precomputed-segment
 * services — the only input that differs between the two domains is which segment IDs are passed in.
 */
export async function flattenSegmentMembers(
  segmentRepository: SegmentRepository,
  segmentIds: string[],
  seen: Set<string>
): Promise<string[]> {
  const unresolved = segmentIds.filter((id) => !seen.has(id));
  if (!unresolved.length) return [];

  unresolved.forEach((id) => seen.add(id));

  const segments = await segmentRepository
    .createQueryBuilder('segment')
    .leftJoinAndSelect('segment.individualForSegment', 'individual')
    .leftJoinAndSelect('segment.groupForSegment', 'group')
    .leftJoinAndSelect('segment.subSegments', 'subSegment')
    .where('segment.id IN (:...ids)', { ids: unresolved })
    .getMany();

  const ids: string[] = [];
  const subSegmentIds: string[] = [];

  for (const segment of segments) {
    // Individuals are stored bare; groups are namespaced with their type (see precomputedGroupKey).
    segment.individualForSegment.forEach((ind) => ids.push(ind.userId));
    segment.groupForSegment.forEach((grp) => ids.push(precomputedGroupKey(grp.type, grp.groupId)));
    segment.subSegments.forEach((sub) => {
      if (!seen.has(sub.id)) subSegmentIds.push(sub.id);
    });
  }

  if (subSegmentIds.length) {
    const subIds = await flattenSegmentMembers(segmentRepository, subSegmentIds, seen);
    ids.push(...subIds);
  }

  return ids;
}
