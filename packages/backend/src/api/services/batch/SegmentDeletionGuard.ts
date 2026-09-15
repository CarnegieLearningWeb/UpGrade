import { EntityManager } from 'typeorm';
import { SEGMENT_TYPE } from 'upgrade_types';
import { DeletionRepository } from '../../repositories/DeletionRepository';

export class SegmentDeletionBlockedError extends Error {
  constructor(public readonly segmentId: string, public readonly reason: 'missing' | 'protected' | 'used') {
    super(`Segment ${segmentId} cannot be deleted: ${reason}`);
    this.name = 'SegmentDeletionBlockedError';
  }
}

/** Guard for ordinary public-segment deletion. Call inside the transaction that will delete this segment. */
export async function assertSegmentDeletionAllowed(
  id: string,
  manager: EntityManager,
  repository: DeletionRepository
): Promise<void> {
  if (!manager.queryRunner?.isTransactionActive) {
    throw new Error('Segment deletion guard requires an active transaction');
  }
  const isolation = await repository.getTransactionIsolation(manager);
  if (isolation !== 'read committed') {
    throw new Error('Segment deletion guard requires READ COMMITTED isolation');
  }

  await repository.setLockTimeout(manager);
  const target = await repository.findSegmentForDeletion(id, manager);
  if (!target) {
    throw new SegmentDeletionBlockedError(id, 'missing');
  }
  if (target.type !== SEGMENT_TYPE.PUBLIC) {
    throw new SegmentDeletionBlockedError(id, 'protected');
  }

  const used = await repository.lockReferencesAndCheckSegmentUsage(id, manager);
  if (used) {
    throw new SegmentDeletionBlockedError(id, 'used');
  }
}
