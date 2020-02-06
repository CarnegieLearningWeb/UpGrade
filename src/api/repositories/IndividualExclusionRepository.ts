import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { IndividualExclusion } from '../models/IndividualExclusion';
import repositoryError from './utils/repositoryError';

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
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('IndividualExclusionRepository', 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public findExcluded(userId: string, experimentIds: string[]): Promise<IndividualExclusion[]> {
    return this.createQueryBuilder('individualExclusion')
      .where('individualExclusion.userId = :userId AND individualExclusion.experimentId IN (:...experimentIds)', {
        userId,
        experimentIds,
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'IndividualExclusionRepository',
          'findExcluded',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async deleteByExperimentId(
    experimentId: string,
    entityManager: EntityManager
  ): Promise<IndividualExclusion[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(IndividualExclusion)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'IndividualExclusionRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
