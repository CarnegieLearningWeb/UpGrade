import { Repository, EntityManager } from 'typeorm';
import repositoryError from '../utils/repositoryError';

export class BaseIndividualExclusionRepository<T> extends Repository<T> {
  constructor(public className: any) {
    super();
  }
  public async saveRawJson(rawData: Array<Omit<T, 'createdAt' | 'updatedAt' | 'versionNumber'>>): Promise<T[]> {
    const result = await this.createQueryBuilder('individualExclusion')
      .insert()
      .into(this.className)
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

  public findExcluded(userId: string, experimentIds: string[]): Promise<T[]> {
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

  public async deleteByExperimentId(experimentId: string, entityManager: EntityManager): Promise<T[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(this.className)
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

  public async deleteExperimentsForUserId(userId: string, experimentIds: string[]): Promise<T[]> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(this.className)
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
