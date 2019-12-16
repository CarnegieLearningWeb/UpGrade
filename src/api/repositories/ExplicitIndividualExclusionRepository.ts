import { Repository, EntityRepository } from 'typeorm';
import { ExplicitIndividualExclusion } from '../models/ExplicitIndividualExclusion';

@EntityRepository(ExplicitIndividualExclusion)
export class ExplicitIndividualExclusionRepository extends Repository<ExplicitIndividualExclusion> {
  public async saveRawJson(rawData: Partial<ExplicitIndividualExclusion>): Promise<ExplicitIndividualExclusion> {
    const result = await this.createQueryBuilder('explicitIndividualExclusion')
      .insert()
      .into(ExplicitIndividualExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute();

    return result.raw;
  }
}
