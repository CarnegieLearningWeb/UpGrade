import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { DecisionPointCondition } from '../models/DecisionPointCondition';

@EntityRepository(DecisionPointCondition)
export class DecisionPointConditionRepository extends Repository<DecisionPointCondition> {
  public async getAllDecisionPointCondition(logger: UpgradeLogger): Promise<DecisionPointCondition[]> {
    return await this.createQueryBuilder('decisionPointCondition')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'decisionPointConditionRepository',
          'getAllDecisionPointCondition',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertDecisionPointCondition(
    decisionPointConditiontDoc: DecisionPointCondition[],
    entityManager: EntityManager
  ): Promise<DecisionPointCondition[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(DecisionPointCondition)
      .values(decisionPointConditiontDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'insertDecisionPointConditions',
        { decisionPointConditiontDoc: decisionPointConditiontDoc }, errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }

  public async deleteDecisionPointCondition(id: string, logger: UpgradeLogger): Promise<DecisionPointCondition> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(DecisionPointCondition)
      .where('id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'decisionPointConditionRepository',
          'deleteDecisionPointCondition',
          { id },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}