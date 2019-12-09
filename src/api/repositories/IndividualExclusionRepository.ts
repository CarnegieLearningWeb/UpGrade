import { Repository, EntityRepository } from 'typeorm';
import { IndividualExclusion } from '../models/IndividualExclusion';

type IndividualExclusionInput = Omit<IndividualExclusion, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(IndividualExclusion)
export class IndividualExclusionRepository extends Repository<IndividualExclusion> {
  public async saveRawJson(rawData: IndividualExclusionInput[]): Promise<IndividualExclusion[]> {
    const result = await this.createQueryBuilder('individualExclusion')
      .insert()
      .into(IndividualExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute();

    return result.raw;
  }

  public findExcluded(userId: string, experimentIds: string[]): Promise<IndividualExclusion[]> {
    return this.createQueryBuilder('individualExclusion')
      .where('individualExclusion.userId = :userId AND individualExclusion.experimentId IN (:...experimentIds)', {
        userId,
        experimentIds,
      })
      .getMany();
  }
}
