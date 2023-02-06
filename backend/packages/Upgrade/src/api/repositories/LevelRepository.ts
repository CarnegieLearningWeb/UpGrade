import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { Level } from '../models/Level';

@EntityRepository(Level)
export class LevelRepository extends Repository<Level> {
  public async getAllLevel(logger: UpgradeLogger): Promise<Level[]> {
    return await this.createQueryBuilder('level')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('levelRepository', 'getAllLevel', {}, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertLevel(levelDoc: Level[], entityManager: EntityManager): Promise<Level[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Level)
      .values(levelDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'insertLevel', { levelDoc: levelDoc }, errorMsg);
        throw errorMsgString;
      });
    return result.raw || [];
  }

  public async upsertLevel(levelDoc: Partial<Level>, entityManager: EntityManager): Promise<Level> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Level)
      .values(levelDoc)
      .onConflict(`("id") DO UPDATE SET "name" = :name`)
      .setParameter('name', levelDoc.name)
      .returning('*')
      .execute()
      .catch((error: any) => {
        const errorMsgString = repositoryError('LevelRepository', 'upsertLevel', { levelDoc }, error);
        throw errorMsgString;
      });

    return result.raw[0] || [];
  }

  public async deleteLevel(id: string, logger: UpgradeLogger): Promise<Level> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(Level)
      .where('id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('levelRepository', 'deleteLevel', { id }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}
