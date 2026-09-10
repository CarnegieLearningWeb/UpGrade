import { Inject, Service } from 'typedi';
import { DataSource, In } from 'typeorm';
import { UnauthorizedError } from 'routing-controllers';
import {
  DeletionEligibilityItem,
  DeletionEligibilityResult,
  DeletionReasonCode,
  getExperimentDeletionState,
  getExperimentDeletionReason,
  getFlagDeletionReason,
  hasBatchDeletePermission,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
} from 'upgrade_types';
import { InjectDataSource } from '../../../typeorm-typedi-extensions';
import { UserDTO } from '../../DTO/UserDTO';
import { Experiment } from '../../models/Experiment';
import { FeatureFlag } from '../../models/FeatureFlag';
import { Segment } from '../../models/Segment';
import { SegmentService, SegmentWithStatus } from '../SegmentService';

type EligibilitySummary = Omit<DeletionEligibilityItem, 'id' | 'canDelete'>;

/** Read-only batch checks, also used by the initial batch-delete preflight. */
@Service()
export class DeletionEligibilityService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(() => SegmentService) private segmentService: SegmentService
  ) {}

  public async experiments(ids: string[], user: UserDTO): Promise<DeletionEligibilityResult> {
    const permission = this.permissionReason(user);
    const rows = await this.dataSource.getRepository(Experiment).find({
      where: { id: In(ids) },
      select: { id: true, name: true, state: true },
    });
    return this.result(ids, rows, (row) => {
      const state = getExperimentDeletionState(row.state);
      return {
        availability: 'present',
        name: row.name,
        stateOrStatus: state,
        reasonCode: permission || getExperimentDeletionReason(row.state),
      };
    });
  }

  public async flags(ids: string[], user: UserDTO): Promise<DeletionEligibilityResult> {
    const permission = this.permissionReason(user);
    const rows = await this.dataSource.getRepository(FeatureFlag).find({
      where: { id: In(ids) },
      select: { id: true, name: true, status: true },
    });
    return this.result(ids, rows, (row) => ({
      availability: 'present',
      name: row.name,
      stateOrStatus: row.status,
      reasonCode: permission || getFlagDeletionReason(row.status),
    }));
  }

  public async segments(ids: string[], user: UserDTO): Promise<DeletionEligibilityResult> {
    const permission = this.permissionReason(user, true);
    const rows = await this.dataSource
      .getRepository(Segment)
      .createQueryBuilder('segment')
      .leftJoin('segment.subSegments', 'child')
      .select(['segment.id', 'segment.name', 'segment.type', 'child.id'])
      .where('segment.id IN (:...ids)', { ids })
      .getMany();
    const publicRows = rows.filter((row) => row.type === SEGMENT_TYPE.PUBLIC);
    // One evaluation for the entire selection; no per-ID detail/member loads or mutation locks.
    const statuses = publicRows.length
      ? ((await this.segmentService.getSegmentStatus(publicRows)).segmentsData as SegmentWithStatus[])
      : [];
    const statusById = new Map(statuses.map((row) => [row.id, row.status]));
    return this.result(ids, rows, (row) => {
      // Private list internals are not part of the ordinary public-segment selection response.
      if (row.type === SEGMENT_TYPE.PRIVATE) {
        return { availability: 'unavailable', reasonCode: DeletionReasonCode.PROTECTED_SEGMENT_TYPE };
      }
      const status = row.type === SEGMENT_TYPE.GLOBAL_EXCLUDE ? SEGMENT_STATUS.EXCLUDED : statusById.get(row.id);
      return {
        availability: status ? 'present' : 'unavailable',
        name: row.name,
        segmentType: row.type,
        stateOrStatus: status,
        reasonCode:
          permission ||
          (row.type !== SEGMENT_TYPE.PUBLIC
            ? DeletionReasonCode.PROTECTED_SEGMENT_TYPE
            : status === SEGMENT_STATUS.UNUSED
            ? undefined
            : status === SEGMENT_STATUS.USED
            ? DeletionReasonCode.SEGMENT_IN_USE
            : DeletionReasonCode.ELIGIBILITY_UNAVAILABLE),
      };
    });
  }

  private permissionReason(user: UserDTO, segments = false): DeletionReasonCode | undefined {
    if (!user) throw new UnauthorizedError('A current user is required');
    const allowed = hasBatchDeletePermission(user.role, segments ? 'segments' : 'experiments');
    return allowed ? undefined : DeletionReasonCode.MISSING_PERMISSION;
  }

  private result<T extends { id: string }>(
    ids: string[],
    rows: T[],
    summarize: (row: T) => EligibilitySummary
  ): DeletionEligibilityResult {
    const byId = new Map(rows.map((row) => [row.id.toLowerCase(), row]));
    const items = ids.map((id): DeletionEligibilityItem => {
      const row = byId.get(id.toLowerCase());
      if (!row) {
        return { id, availability: 'not_found', canDelete: false, reasonCode: DeletionReasonCode.NOT_FOUND };
      }
      const summary = summarize(row);
      return { id, ...summary, canDelete: summary.availability === 'present' && !summary.reasonCode };
    });
    return { items, allDeletable: items.length > 0 && items.every((item) => item.canDelete) };
  }
}
