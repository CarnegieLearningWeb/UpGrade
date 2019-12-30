import { ExperimentCondition } from '../models/ExperimentCondition';
import { Repository, EntityRepository, EntityManager } from 'typeorm';

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
        `("id") DO UPDATE SET "name" = :name, "description" = :description, "conditionCode" = :conditionCode, "assignmentWeight" = :assignmentWeight`
      )
      .setParameter('name', conditionDoc.name)
      .setParameter('description', conditionDoc.description)
      .setParameter('conditionCode', conditionDoc.conditionCode)
      .setParameter('assignmentWeight', conditionDoc.assignmentWeight)
      .returning('*')
      .execute();

    return result.raw[0];
  }

  // public async updateExperimentCondition(
  //   conditionId: string,
  //   conditionDoc: Partial<ExperimentCondition>
  // ): Promise<ExperimentCondition> {
  //   const result = await this.createQueryBuilder('condition')
  //     .update()
  //     .set(conditionDoc)
  //     .where('id = :id', { id: conditionId })
  //     .returning('*')
  //     .execute();
  //   return result.raw[0];
  // }

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
      .execute();

    return result.raw;
  }

  public async deleteCondition(id: string, entityManager: EntityManager): Promise<void> {
    entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentCondition)
      .where('id=:id', { id })
      .execute();
  }
}
