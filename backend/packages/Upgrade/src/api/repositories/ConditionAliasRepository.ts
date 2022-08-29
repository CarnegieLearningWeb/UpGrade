import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { ConditionAlias } from '../models/ConditionAlias';

@EntityRepository(ConditionAlias)
export class ConditionAliasRepository extends Repository<ConditionAlias> {
  public async getAllConditionAlias(logger: UpgradeLogger): Promise<ConditionAlias[]> {
    return await this.createQueryBuilder('conditionAlias')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'conditionAliasRepository',
          'getAllConditionAlias',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertConditionAlias(
    conditionAliasDoc: ConditionAlias[],
    entityManager: EntityManager
  ): Promise<ConditionAlias[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ConditionAlias)
      .values(conditionAliasDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'insertConditionAlias',
        { conditionAliasDoc: conditionAliasDoc }, errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }

  public async findAliasName(conditionId: string, partitionId: string): Promise<Pick<ConditionAlias, 'aliasName'> | null> {
    return this.createQueryBuilder('conditionAlias')
      .select(['conditionAlias.aliasName'])
      .where('"conditionAlias"."parentConditionId" =:conditionId AND conditionAlias.decisionPointId =:partitionId',
        { conditionId, partitionId })
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'partitionPointAndName', undefined, errorMsg);
        throw errorMsgString;
      });
  }

  public async deleteConditionAlias(id: string, logger: UpgradeLogger): Promise<ConditionAlias> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ConditionAlias)
      .where('id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'conditionAliasRepository',
          'deleteConditionAlias',
          { id },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}