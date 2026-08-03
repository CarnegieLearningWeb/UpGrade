import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { ExperimentPrecomputedSegment } from '../models/ExperimentPrecomputedSegment';

@EntityRepository(ExperimentPrecomputedSegment)
export class ExperimentPrecomputedSegmentRepository extends Repository<ExperimentPrecomputedSegment> {
  public async upsertByExperimentId(
    experimentId: string,
    inclusionIds: string[],
    exclusionIds: string[]
  ): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into(ExperimentPrecomputedSegment)
      .values({ experimentId, inclusionIds, exclusionIds })
      .orUpdate(['inclusionIds', 'exclusionIds', 'updatedAt'], ['experimentId'])
      .execute();
  }

  public async findByExperimentIds(experimentIds: string[]): Promise<(ExperimentPrecomputedSegment | null)[]> {
    if (!experimentIds.length) return [];
    const rows = await this.createQueryBuilder('ps')
      .where('ps.experimentId IN (:...ids)', { ids: experimentIds })
      .getMany();
    const rowsByExperimentId = new Map(rows.map((r) => [r.experimentId, r]));
    return experimentIds.map((id) => rowsByExperimentId.get(id) ?? null);
  }
}
