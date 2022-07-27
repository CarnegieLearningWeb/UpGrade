import { ExperimentCondition } from '../models/ExperimentCondition';
import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExperimentCondition)
export class ExperimentConditionRepository extends Repository<ExperimentCondition> {
  public async upsertExperimentCondition(
    conditionDoc: Partial<ExperimentCondition>,
    entityManager: EntityManager
  ): Promise<ExperimentCondition> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ExperimentCondition)
      .values(conditionDoc)
      .onConflict(
        `("id") DO UPDATE SET "name" = :name, "description" = :description, "conditionCode" = :conditionCode, "assignmentWeight" = :assignmentWeight, "order" = :order`
      )
      .setParameter('name', conditionDoc.name)
      .setParameter('description', conditionDoc.description)
      .setParameter('conditionCode', conditionDoc.conditionCode)
      .setParameter('assignmentWeight', conditionDoc.assignmentWeight)
      .setParameter('order', conditionDoc.order)
      .returning('*')
      .execute()
      .catch((error: any) => {
        const errorMsgString = repositoryError(
          'ExperimentConditionRepository',
          'upsertExperimentCondition',
          { conditionDoc },
          error
        );
        throw errorMsgString;
      });

    return result.raw[0];
  }

  public async deleteByIds(ids: string[], entityManager: EntityManager): Promise<ExperimentCondition[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentCondition)
      .where('id IN (:...ids)', { ids })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentConditionRepository', 'deleteByIds', { ids }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async insertConditions(
    conditionDocs: Array<Partial<ExperimentCondition>>,
    entityManager: EntityManager
  ): Promise<ExperimentCondition[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ExperimentCondition)
      .values(conditionDocs)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentConditionRepository',
          'insertConditions',
          { conditionDocs },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteCondition(id: string, entityManager: EntityManager): Promise<void> {
    await entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentCondition)
      .where('id=:id', { id })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentConditionRepository', 'deleteCondition', { id }, errorMsg);
        throw errorMsgString;
      });
  }

  public async getAllUniqueIdentifier(): Promise<string[]> {
    const experimentConditions = await this.createQueryBuilder('condition')
      .select('condition.twoCharacterId')
      .getMany();
    const uniqueIdentifier = experimentConditions.map((experimentCondition) => experimentCondition.twoCharacterId);
    return uniqueIdentifier;
  }
}
