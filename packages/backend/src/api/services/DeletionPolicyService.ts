import { HttpError } from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { DataSource, EntityManager } from 'typeorm';
import {
  BatchDeleteEntity,
  DELETABLE_EXPERIMENT_STATES,
  DeletionReasonCode,
  FEATURE_FLAG_STATUS,
  PermissionResource,
  SEGMENT_TYPE,
  SERVER_ERROR,
} from 'upgrade_types';
import { InjectDataSource, InjectRepository } from '../../typeorm-typedi-extensions';
import { DeletionTransaction } from '../../types/DeletionTransaction';
import { UserDTO } from '../DTO/UserDTO';
import { DeletionRepository, DeletionTarget } from '../repositories/DeletionRepository';
import { PermissionService } from './PermissionService';

/** The deletion APIs call feature flags `flags`; the shared permission table calls them `featureFlags`. */
const PERMISSION_RESOURCE: Record<BatchDeleteEntity, PermissionResource> = {
  experiments: 'experiments',
  flags: 'featureFlags',
  segments: 'segments',
};

export type DeletionRefusalCode =
  | DeletionReasonCode.STATE_NOT_DELETABLE
  | DeletionReasonCode.SEGMENT_IN_USE
  | DeletionReasonCode.GLOBAL_EXCLUDE_PROTECTED;

/** A single-item deletion refused by policy. The target is unchanged. */
export class DeletionRefusedError extends HttpError {
  public readonly type = SERVER_ERROR.DELETION_NOT_ALLOWED;

  constructor(public readonly reasonCode: DeletionRefusalCode) {
    super(409, `Deletion not allowed: ${reasonCode}`);
    Object.setPrototypeOf(this, DeletionRefusedError.prototype);
  }
}

/**
 * The one deletion policy for the single and batch deletion APIs. The UI hides or disables Delete using the same
 * rules, but the current caller role and the target's state read under its deletion lock are the authority.
 *
 * Internal deletions (rollback of a failed create, removing a private list) call the entity services directly and
 * are not subject to this policy.
 */
@Service()
export class DeletionPolicyService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository() private deletionRepository: DeletionRepository,
    @Inject(() => PermissionService) private permissionService: PermissionService
  ) {}

  /** Throws 403 when the caller's role cannot delete this entity type. Call before locking or reading any target. */
  public assertRoleCanDelete(entity: BatchDeleteEntity, user: UserDTO | undefined): void {
    this.permissionService.assertPermitted(user, PERMISSION_RESOURCE[entity], 'delete');
  }

  /**
   * Evaluates the state and usage rules for a target already locked by `DeletionRepository.findForDeletion()`,
   * using the same transaction manager. Returns the refusal reason, or undefined when deletion is allowed.
   */
  public async getRefusalReason(
    entity: BatchDeleteEntity,
    target: DeletionTarget,
    manager: EntityManager
  ): Promise<DeletionRefusalCode | undefined> {
    if (entity === 'experiments') {
      return DELETABLE_EXPERIMENT_STATES.includes(target.state) ? undefined : DeletionReasonCode.STATE_NOT_DELETABLE;
    }
    if (entity === 'flags') {
      return target.status === FEATURE_FLAG_STATUS.ENABLED ? DeletionReasonCode.STATE_NOT_DELETABLE : undefined;
    }
    if (target.type === SEGMENT_TYPE.GLOBAL_EXCLUDE) return DeletionReasonCode.GLOBAL_EXCLUDE_PROTECTED;
    return (await this.deletionRepository.isSegmentInUse(target.id, manager))
      ? DeletionReasonCode.SEGMENT_IN_USE
      : undefined;
  }

  /**
   * A deletion transaction for the single-item DELETE routes: locks the target, refuses it with
   * `DeletionRefusedError` before any mutation, then runs the entity service's deletion in the same transaction.
   * A missing target is left for the entity service to report, so each route keeps its existing not-found response.
   */
  public singleDeletionTransaction(entity: BatchDeleteEntity, id: string): DeletionTransaction {
    return (work) =>
      this.dataSource.transaction(async (manager) => {
        const target = await this.deletionRepository.findForDeletion(entity, id, manager);
        if (target) {
          const reasonCode = await this.getRefusalReason(entity, target, manager);
          if (reasonCode) throw new DeletionRefusedError(reasonCode);
        }
        return work(manager);
      });
  }
}
