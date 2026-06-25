import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { PrecomputedSegment } from '../models/PrecomputedSegment';

@EntityRepository(PrecomputedSegment)
export class PrecomputedSegmentRepository extends Repository<PrecomputedSegment> {
  public async upsertByFlagId(flagId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into(PrecomputedSegment)
      .values({ featureFlagId: flagId, inclusionIds, exclusionIds })
      .orUpdate(['inclusionIds', 'exclusionIds', 'updatedAt'], ['featureFlagId'])
      .execute();
  }

  public async findByFlagIds(flagIds: string[]): Promise<(PrecomputedSegment | null)[]> {
    if (!flagIds.length) return [];
    const rows = await this.createQueryBuilder('ps').where('ps.featureFlagId IN (:...ids)', { ids: flagIds }).getMany();
    return flagIds.map((id) => rows.find((r) => r.featureFlagId === id) ?? null);
  }
}
