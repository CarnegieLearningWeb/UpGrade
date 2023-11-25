import { EntityRepository, Repository } from 'typeorm';
import { ArchivedStats } from '../models/ArchivedStats';
import repositoryError from './utils/repositoryError';

@EntityRepository(ArchivedStats)
export class ArchivedStatsRepository extends Repository<ArchivedStats> {
  public async saveRawJson(
    rawDataArray: Array<Omit<ArchivedStats, 'createdAt' | 'updatedAt' | 'versionNumber'>>
  ): Promise<ArchivedStats> {
    const result = await this.createQueryBuilder('ArchivedStats')
      .insert()
      .into(ArchivedStats)
      .values(rawDataArray)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawDataArray }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}