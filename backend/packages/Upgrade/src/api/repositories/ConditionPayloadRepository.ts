import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { ConditionPayload } from '../models/ConditionPayload';

@EntityRepository(ConditionPayload)
export class ConditionPayloadRepository extends Repository<ConditionPayload> {
  public async getAllConditionPayload(logger: UpgradeLogger): Promise<ConditionPayload[]> {
    return await this.createQueryBuilder('conditionPayload')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('conditionPayloadRepository', 'getAllConditionPayload', {}, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertConditionPayload(
    conditionPayloadDoc: Array<Partial<ConditionPayload>>,
    entityManager: EntityManager
  ): Promise<ConditionPayload[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ConditionPayload)
      .values(conditionPayloadDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'insertConditionPayload',
          { conditionPayloadDoc: conditionPayloadDoc },
          errorMsg
        );
        throw errorMsgString;
      });
    return result.raw || [];
  }

  public async upsertConditionPayload(
    conditionPayloadDoc: Partial<ConditionPayload>,
    entityManager: EntityManager
  ): Promise<ConditionPayload> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ConditionPayload)
      .values(conditionPayloadDoc)
      .onConflict(`("id") DO UPDATE SET "payloadValue" = :payloadValue`)
      .setParameter('payloadValue', conditionPayloadDoc.payloadValue)
      .returning('*')
      .execute()
      .catch((error: any) => {
        const errorMsgString = repositoryError(
          'ConditionPayloadRepository',
          'upsertConditionPayload',
          { conditionPayloadDoc },
          error
        );
        throw errorMsgString;
      });

    return result.raw[0] || [];
  }

  public async deleteConditionPayload(id: string, logger: UpgradeLogger): Promise<ConditionPayload> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ConditionPayload)
      .where('id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'conditionPayloadRepository',
          'deleteConditionPayload',
          { id },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}
