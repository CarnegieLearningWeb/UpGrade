import { Repository, EntityManager } from 'typeorm';
import repositoryError from '../utils/repositoryError';

export class BaseGroupExclusionRepository<T> extends Repository<T> {
  constructor(public className: any) {
    super();
  }

  public async saveRawJson(rawData: Array<Omit<T, 'createdAt' | 'updatedAt' | 'versionNumber'>>): Promise<T> {
    const result = await this.createQueryBuilder('groupExclusion')
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

  public findExcluded(groupIds: string[], experimentIds: string[]): Promise<T[]> {
    return this.createQueryBuilder('groupExclusion')
      .where('groupExclusion.groupId IN (:...groupIds) AND groupExclusion.experimentId IN (:...experimentIds)', {
        groupIds,
        experimentIds,
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findExcluded',
          { groupIds, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }
}
