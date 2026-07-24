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
