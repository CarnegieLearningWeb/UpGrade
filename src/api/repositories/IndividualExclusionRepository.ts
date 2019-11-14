import { Repository, EntityRepository } from 'typeorm';
import { IndividualExclusion } from '../models/IndividualExclusion';

@EntityRepository(IndividualExclusion)
export class IndividualExclusionRepository extends Repository<
  IndividualExclusion
> {
  public saveRawJson(rawData: IndividualExclusion): Promise<any> {
    return this.createQueryBuilder('individualExclusion')
      .insert()
      .into(IndividualExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .execute();
  }

  public findExcluded(
    userId: string,
    experimentIds: string[]
  ): Promise<IndividualExclusion[]> {
    return this.createQueryBuilder('individualExclusion')
      .where(
        'individualExclusion.userId = :userId AND individualExclusion.experimentId IN (:...experimentIds)',
        {
          userId,
          experimentIds,
        }
      )
      .getMany();
  }
}
