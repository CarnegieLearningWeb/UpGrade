import { getPrecomputedMemberSets, precomputedGroupKey } from '../../../src/api/services/precomputedSegmentHelpers';

describe('getPrecomputedMemberSets', () => {
  const row = () => ({
    inclusionIds: ['user-1', precomputedGroupKey('schoolId', 'school-1')],
    exclusionIds: ['user-2'],
  });

  it('should expose the ID arrays as Sets', () => {
    const { inclusionSet, exclusionSet } = getPrecomputedMemberSets(row());

    expect(inclusionSet.has('user-1')).toBe(true);
    expect(inclusionSet.has(precomputedGroupKey('schoolId', 'school-1'))).toBe(true);
    expect(inclusionSet.has('user-2')).toBe(false);
    expect(exclusionSet.has('user-2')).toBe(true);
  });

  // The whole point: cached rows are handed to every request, so the Sets must be built once per
  // row rather than once per request.
  it('should return the same Sets for repeated calls on the same row', () => {
    const cachedRow = row();

    const first = getPrecomputedMemberSets(cachedRow);
    const second = getPrecomputedMemberSets(cachedRow);

    expect(second.inclusionSet).toBe(first.inclusionSet);
    expect(second.exclusionSet).toBe(first.exclusionSet);
  });

  // A recompute replaces the cached row with a new object, which must not inherit stale Sets.
  it('should build fresh Sets for a replacement row', () => {
    const original = getPrecomputedMemberSets(row());
    const recomputed = getPrecomputedMemberSets({ inclusionIds: ['user-9'], exclusionIds: [] });

    expect(recomputed.inclusionSet).not.toBe(original.inclusionSet);
    expect(recomputed.inclusionSet.has('user-9')).toBe(true);
    expect(recomputed.inclusionSet.has('user-1')).toBe(false);
  });
});
