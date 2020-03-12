import { Repository, EntityManager } from 'typeorm';
import repositoryError from '../utils/repositoryError';

export class BaseMonitorExperimentPointRepository<T> extends Repository<T> {
  constructor(public className: any) {
    super();
  }

  public async saveRawJson(rawData: Omit<T, 'createdAt' | 'updatedAt' | 'versionNumber'>): Promise<T> {
    const result = await this.createQueryBuilder('monitoredPoint')
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

  public async deleteById(ids: string[], entityManager: EntityManager): Promise<T[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(this.className)
      .where('id IN (:...ids)', { ids })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deleteById', { ids }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
