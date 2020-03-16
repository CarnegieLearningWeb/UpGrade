import { EntityRepository, Repository, EntityManager } from 'typeorm';
import { IndividualExclusion } from '../models/IndividualExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(IndividualExclusion)
export class IndividualExclusionRepository extends Repository<IndividualExclusion> {
  public async saveRawJson(
    rawData: Array<Omit<IndividualExclusion, 'createdAt' | 'updatedAt' | 'versionNumber'>>
  ): Promise<IndividualExclusion[]> {
    const result = await this.createQueryBuilder('individualExclusion')
      .insert()
      .into(IndividualExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
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
          this.constructor.name,
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
          this.constructor.name,
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteExperimentsForUserId(userId: string, experimentIds: string[]): Promise<IndividualExclusion[]> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(IndividualExclusion)
      .where('userId = :userId AND experimentId IN (:...experimentIds)', {
        userId,
        experimentIds,
      })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'deleteExperimentsForUserId',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
