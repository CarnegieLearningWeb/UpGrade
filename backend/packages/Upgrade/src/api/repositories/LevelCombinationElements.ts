import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { LevelCombinationElement } from '../models/LevelCombinationElement';

@EntityRepository(LevelCombinationElement)
export class LevelCombinationElementRepository extends Repository<LevelCombinationElement> {
  public async getAllLevelCombinationElement(logger: UpgradeLogger): Promise<LevelCombinationElement[]> {
    return await this.createQueryBuilder('levelCombinationElement')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'levelCombinationElementRepository',
          'getAllLevelCombinationElement',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertLevelCombinationElement(
    levelCombinationElementDoc: Array<Partial<LevelCombinationElement>>,
    entityManager: EntityManager
  ): Promise<LevelCombinationElement[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(LevelCombinationElement)
      .values(levelCombinationElementDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'insertLevelCombinationElement',
          { levelCombinationElementDoc: levelCombinationElementDoc },
          errorMsg
        );
        throw errorMsgString;
      });
    return result.raw || [];
  }

  public async upsertLevelCombinationElement(
    levelCombinationElementDoc: Partial<LevelCombinationElement>,
    entityManager: EntityManager
  ): Promise<LevelCombinationElement> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(LevelCombinationElement)
      .values(levelCombinationElementDoc)
      .onConflict('DO NOTHING')
      .returning('*')
      .execute()
      .catch((error: any) => {
        const errorMsgString = repositoryError(
          'LevelCombinationElementRepository',
          'upsertLevelCombinationElement',
          { levelCombinationElementDoc },
          error
        );
        throw errorMsgString;
      });

    return result.raw[0] || [];
  }

  public async deleteLevelCombinationElement(id: string, logger: UpgradeLogger): Promise<LevelCombinationElement> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(LevelCombinationElement)
      .where('id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'levelCombinationElementRepository',
          'deleteLevelCombinationElement',
          { id },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}
