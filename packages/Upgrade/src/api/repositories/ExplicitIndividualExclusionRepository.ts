import { Repository, EntityRepository } from 'typeorm';
import { ExplicitIndividualExclusion } from '../models/ExplicitIndividualExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExplicitIndividualExclusion)
export class ExplicitIndividualExclusionRepository extends Repository<ExplicitIndividualExclusion> {
  public async saveRawJson(rawData: Partial<ExplicitIndividualExclusion>): Promise<ExplicitIndividualExclusion> {
    const result = await this.createQueryBuilder('explicitIndividualExclusion')
      .insert()
      .into(ExplicitIndividualExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitIndividualExclusionRepository',
          'saveRawJson',
          { rawData },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteById(userId: string): Promise<ExplicitIndividualExclusion> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExplicitIndividualExclusion)
      .where('userId=:userId', { userId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitIndividualExclusionRepository',
          'deleteById',
          { userId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
