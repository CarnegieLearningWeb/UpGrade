import { Repository, EntityRepository } from 'typeorm';
import { ExplicitGroupExclusion } from '../models/ExplicitGroupExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExplicitGroupExclusion)
export class ExplicitGroupExclusionRepository extends Repository<ExplicitGroupExclusion> {
  public async saveRawJson(rawData: Partial<ExplicitGroupExclusion>): Promise<ExplicitGroupExclusion> {
    const result = await this.createQueryBuilder('explicitGroupExclusion')
      .insert()
      .into(ExplicitGroupExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitGroupExclusionRepository',
          'saveRawJson',
          { rawData },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteGroup(groupId: string, type: string): Promise<ExplicitGroupExclusion | undefined> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExplicitGroupExclusion)
      .where('groupId=:groupId AND type=:type', { groupId, type })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitGroupExclusionRepository',
          'deleteGroup',
          { groupId, type },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
