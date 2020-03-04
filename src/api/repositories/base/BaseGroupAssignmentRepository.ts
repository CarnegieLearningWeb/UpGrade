import { Repository, EntityManager } from 'typeorm';
import repositoryError from '../utils/repositoryError';

export class BaseGroupAssignmentRepository<T> extends Repository<T> {
  constructor(public className: any) {
    super();
  }

  public findExperiment(groupIds: string[], experimentIds: string[]): Promise<T[]> {
    return this.createQueryBuilder('groupAssignment')
      .leftJoinAndSelect('groupAssignment.condition', 'condition')
      .where('groupAssignment.groupId IN (:...groupIds) AND groupAssignment.experimentId IN (:...experimentIds)', {
        groupIds,
        experimentIds,
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findExperiment',
          { groupIds, experimentIds },
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

  public async saveRawJson(rawData: Omit<T, 'createdAt' | 'updatedAt' | 'versionNumber'>): Promise<T> {
    const result = await this.createQueryBuilder('groupAssignment')
      .insert()
      .into(this.className)
      .values(rawData)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteByExperimentIds(experimentIds: string[]): Promise<T> {
    const result = await this.createQueryBuilder('groupAssignment')
      .delete()
      .from(this.className)
      .where('groupAssignment.experimentId IN (:...experimentIds)')
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'deleteByExperimentIds',
          { experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
