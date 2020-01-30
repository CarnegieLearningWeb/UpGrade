import { Repository, EntityRepository } from 'typeorm';
import { ExplicitGroupExclusion } from '../models/ExplicitGroupExclusion';

@EntityRepository(ExplicitGroupExclusion)
export class ExplicitGroupExclusionRepository extends Repository<ExplicitGroupExclusion> {
  public async saveRawJson(rawData: Partial<ExplicitGroupExclusion>): Promise<ExplicitGroupExclusion> {
    const result = await this.createQueryBuilder('explicitGroupExclusion')
      .insert()
      .into(ExplicitGroupExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute();

    return result.raw;
  }

  public async deleteGroup(groupId: string, type: string): Promise<ExplicitGroupExclusion | undefined> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExplicitGroupExclusion)
      .where('groupId=:groupId AND type=:type', { groupId, type })
      .returning('*')
      .execute();

    return result.raw;
  }
}
