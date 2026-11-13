import { ForbiddenError } from 'routing-controllers';
import { DataSource, EntityManager } from 'typeorm';
import {
  BatchDeleteEntity,
  DeletionReasonCode,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_TYPE,
  SERVER_ERROR,
  UserRole,
} from 'upgrade_types';
import { DeletionRepository } from '../../../src/api/repositories/DeletionRepository';
import { DeletionPolicyService, DeletionRefusedError } from '../../../src/api/services/DeletionPolicyService';
import { PermissionService } from '../../../src/api/services/PermissionService';

describe('DeletionPolicyService', () => {
  const manager = {} as EntityManager;
  let repository: { findForDeletion: jest.Mock; isSegmentInUse: jest.Mock };
  let policy: DeletionPolicyService;

  beforeEach(() => {
    repository = { findForDeletion: jest.fn(), isSegmentInUse: jest.fn().mockResolvedValue(false) };
    const dataSource = { transaction: jest.fn((work) => work(manager)) } as unknown as DataSource;
    policy = new DeletionPolicyService(
      dataSource,
      repository as unknown as DeletionRepository,
      new PermissionService()
    );
  });

  const allowed: Record<UserRole, BatchDeleteEntity[]> = {
    [UserRole.ADMIN]: ['experiments', 'flags', 'segments'],
    [UserRole.CREATOR]: ['experiments', 'flags', 'segments'],
    [UserRole.USER_MANAGER]: ['segments'],
    [UserRole.READER]: [],
  };
  test.each(
    Object.values(UserRole).flatMap((role) =>
      (['experiments', 'flags', 'segments'] as BatchDeleteEntity[]).map((entity) => ({
        role,
        entity,
        permitted: allowed[role].includes(entity),
      }))
    )
  )('$role deleting $entity is permitted: $permitted', ({ role, entity, permitted }) => {
    const check = () => policy.assertRoleCanDelete(entity, { email: 'user@example.com', role } as any);
    if (permitted) expect(check).not.toThrow();
    else expect(check).toThrow(ForbiddenError);
  });

  test('refuses a caller with no user or no role', () => {
    expect(() => policy.assertRoleCanDelete('segments', undefined)).toThrow(ForbiddenError);
    expect(() => policy.assertRoleCanDelete('segments', { email: 'user@example.com' } as any)).toThrow(ForbiddenError);
  });

  const deletableStates = [
    EXPERIMENT_STATE.DRAFT,
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.COMPLETED,
    EXPERIMENT_STATE.CANCELLED,
    EXPERIMENT_STATE.ARCHIVED,
  ];
  test.each(Object.values(EXPERIMENT_STATE))('experiment state %s', async (state) => {
    expect(await policy.getRefusalReason('experiments', { id: 'e', state }, manager)).toBe(
      deletableStates.includes(state) ? undefined : DeletionReasonCode.STATE_NOT_DELETABLE
    );
  });

  test.each(Object.values(FEATURE_FLAG_STATUS))('feature flag status %s', async (status) => {
    expect(await policy.getRefusalReason('flags', { id: 'f', status }, manager)).toBe(
      status === FEATURE_FLAG_STATUS.ENABLED ? DeletionReasonCode.STATE_NOT_DELETABLE : undefined
    );
  });

  test('segments: refuses global-exclude without a usage read, then Used, and allows unused', async () => {
    expect(await policy.getRefusalReason('segments', { id: 's', type: SEGMENT_TYPE.GLOBAL_EXCLUDE }, manager)).toBe(
      DeletionReasonCode.GLOBAL_EXCLUDE_PROTECTED
    );
    expect(repository.isSegmentInUse).not.toHaveBeenCalled();
    repository.isSegmentInUse.mockResolvedValueOnce(true);
    expect(await policy.getRefusalReason('segments', { id: 's', type: SEGMENT_TYPE.PUBLIC }, manager)).toBe(
      DeletionReasonCode.SEGMENT_IN_USE
    );
    expect(repository.isSegmentInUse).toHaveBeenCalledWith('s', manager);
    expect(await policy.getRefusalReason('segments', { id: 's', type: SEGMENT_TYPE.PUBLIC }, manager)).toBe(undefined);
  });

  describe('singleDeletionTransaction', () => {
    test('refuses before running the deletion work', async () => {
      repository.findForDeletion.mockResolvedValue({ id: 'f', status: FEATURE_FLAG_STATUS.ENABLED });
      const work = jest.fn();
      const error = await policy
        .singleDeletionTransaction(
          'flags',
          'f'
        )(work)
        .catch((e) => e);
      expect(error).toBeInstanceOf(DeletionRefusedError);
      expect(error).toMatchObject({
        httpCode: 409,
        type: SERVER_ERROR.DELETION_NOT_ALLOWED,
        reasonCode: DeletionReasonCode.STATE_NOT_DELETABLE,
      });
      expect(repository.findForDeletion).toHaveBeenCalledWith('flags', 'f', manager);
      expect(work).not.toHaveBeenCalled();
    });

    test('runs the deletion work in the locking transaction when allowed', async () => {
      repository.findForDeletion.mockResolvedValue({ id: 'f', status: FEATURE_FLAG_STATUS.DISABLED });
      const work = jest.fn().mockResolvedValue('deleted');
      expect(await policy.singleDeletionTransaction('flags', 'f')(work)).toBe('deleted');
      expect(work).toHaveBeenCalledWith(manager);
    });

    test('leaves a missing target to the entity service', async () => {
      repository.findForDeletion.mockResolvedValue(null);
      const work = jest.fn().mockResolvedValue(undefined);
      await policy.singleDeletionTransaction('experiments', 'e')(work);
      expect(work).toHaveBeenCalledWith(manager);
    });
  });
});
