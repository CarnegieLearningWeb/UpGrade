/**
 * Normalizes a decision point target value to an empty string when null or undefined,
 * matching the database column constraint (non-nullable string).
 */
export function normalizeTarget(target?: string | null): string {
  return target ?? '';
}

/**
 * Normalizes the `target` field on every partition/decision-point object in an array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePartitionTargets(partitions: any[]): any[] {
  return partitions.map((partition) => ({
    ...partition,
    target: partition.target ?? '',
  }));
}
