import { Inject, Service } from 'typedi';
import { DataSource, In } from 'typeorm';
import {
  DeletionReasonCode,
  getExperimentDeletionReason,
  getFlagDeletionReason,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
} from 'upgrade_types';
import { InjectDataSource, InjectRepository } from '../../../typeorm-typedi-extensions';
import { Experiment } from '../../models/Experiment';
import { FeatureFlag } from '../../models/FeatureFlag';
import { SegmentRepository } from '../../repositories/SegmentRepository';
import { SegmentService, SegmentWithStatus } from '../SegmentService';

export interface DeletionEligibilityItem {
  id: string;
  availability: 'present' | 'not_found' | 'unavailable';
  canDelete: boolean;
  reasonCode?: DeletionReasonCode;
}

export interface DeletionEligibilityResult {
  items: DeletionEligibilityItem[];
}

type EligibilitySummary = Omit<DeletionEligibilityItem, 'id' | 'canDelete'>;

/** Internal preflight for batch deletion. The caller checks permissions before querying. */
@Service()
export class DeletionEligibilityService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(() => SegmentService) private segmentService: SegmentService,
    @InjectRepository() private segmentRepository: SegmentRepository
  ) {}

  public async experiments(ids: string[]): Promise<DeletionEligibilityResult> {
    const rows = await this.dataSource.getRepository(Experiment).find({
      where: { id: In(ids) },
      select: { id: true, state: true },
    });
    return this.result(ids, rows, (row) => ({
      availability: 'present',
      reasonCode: getExperimentDeletionReason(row.state),
    }));
  }

  public async flags(ids: string[]): Promise<DeletionEligibilityResult> {
    const rows = await this.dataSource.getRepository(FeatureFlag).find({
      where: { id: In(ids) },
      select: { id: true, status: true },
    });
    return this.result(ids, rows, (row) => ({
      availability: 'present',
      reasonCode: getFlagDeletionReason(row.status),
    }));
  }

  public async segments(ids: string[]): Promise<DeletionEligibilityResult> {
    const rows = await this.segmentRepository.findForDeletionEligibility(ids);
    const publicRows = rows.filter((row) => row.type === SEGMENT_TYPE.PUBLIC);
    // One evaluation for the entire selection; no per-ID detail/member loads or mutation locks.
    const statuses = publicRows.length
      ? ((await this.segmentService.getSegmentStatus(publicRows)).segmentsData as SegmentWithStatus[])
      : [];
    const statusById = new Map(statuses.map((row) => [row.id, row.status]));
    return this.result(ids, rows, (row) => {
      if (row.type !== SEGMENT_TYPE.PUBLIC) {
        return { availability: 'present', reasonCode: DeletionReasonCode.PROTECTED_SEGMENT_TYPE };
      }
      const status = statusById.get(row.id);
      return {
        availability: status ? 'present' : 'unavailable',
        reasonCode:
          status === SEGMENT_STATUS.UNUSED
            ? undefined
            : status === SEGMENT_STATUS.USED
            ? DeletionReasonCode.SEGMENT_IN_USE
            : DeletionReasonCode.ELIGIBILITY_UNAVAILABLE,
      };
    });
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
    return { items };
  }
}
