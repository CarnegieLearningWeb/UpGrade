import { Repository, EntityRepository } from 'typeorm';
import { IndividualExclusion } from '../models/IndividualExclusion';

@EntityRepository(IndividualExclusion)
export class IndividualExclusionRepository extends Repository<IndividualExclusion> {
  public saveRawJson(rawData: IndividualExclusion): Promise<any> {
    return this.createQueryBuilder('individualExclusion')
      .insert()
      .into(IndividualExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .execute();
  }
}
