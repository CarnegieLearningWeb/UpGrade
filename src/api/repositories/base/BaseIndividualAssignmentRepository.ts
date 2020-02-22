import { Repository, EntityManager } from 'typeorm';
import repositoryError from '../utils/repositoryError';

export class BaseIndividualAssignmentRepository<T> extends Repository<T> {
  constructor(public className: any) {
    super();
  }
  public findAssignment(userId: string, experimentIds: string[]): Promise<T[]> {
    return this.createQueryBuilder('individualAssignment')
      .leftJoinAndSelect('individualAssignment.condition', 'condition')
      .where('individualAssignment.userId = :userId AND individualAssignment.experimentId IN (:...experimentIds)', {
        userId,
        experimentIds,
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findAssignment',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async saveRawJson(rawData: Omit<T, 'createdAt' | 'updatedAt' | 'versionNumber'>): Promise<T> {
    const result = await this.createQueryBuilder('individualAssignment')
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
}
