import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { FeatureFlagPrecomputedSegment } from '../models/FeatureFlagPrecomputedSegment';

@EntityRepository(FeatureFlagPrecomputedSegment)
export class FeatureFlagPrecomputedSegmentRepository extends Repository<FeatureFlagPrecomputedSegment> {
  public async upsertByFlagId(flagId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into(FeatureFlagPrecomputedSegment)
      .values({ featureFlagId: flagId, inclusionIds, exclusionIds })
      .orUpdate(['inclusionIds', 'exclusionIds', 'updatedAt'], ['featureFlagId'])
      .execute();
  }

  public async findByFlagIds(flagIds: string[]): Promise<(FeatureFlagPrecomputedSegment | null)[]> {
    if (!flagIds.length) return [];
    const rows = await this.createQueryBuilder('ps').where('ps.featureFlagId IN (:...ids)', { ids: flagIds }).getMany();
    const rowsByFlagId = new Map(rows.map((r) => [r.featureFlagId, r]));
    return flagIds.map((id) => rowsByFlagId.get(id) ?? null);
  }
}
