import { ExperimentCondition } from '../models/ExperimentCondition';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(ExperimentCondition)
export class ExperimentConditionRepository extends Repository<ExperimentCondition> {
  public async upsertExperimentCondition(conditionDoc: Partial<ExperimentCondition>): Promise<ExperimentCondition> {
    const result = await this.createQueryBuilder('condition')
      .insert()
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

  public async updateExperimentCondition(
    conditionId: string,
    conditionDoc: Partial<ExperimentCondition>
  ): Promise<ExperimentCondition> {
    const result = await this.createQueryBuilder('condition')
      .update()
      .set(conditionDoc)
      .where('id = :id', { id: conditionId })
      .returning('*')
      .execute();
    return result.raw[0];
  }

  public async insertConditions(conditionDocs: Array<Partial<ExperimentCondition>>): Promise<ExperimentCondition[]> {
    const result = await this.createQueryBuilder('condition')
      .insert()
      .values(conditionDocs)
      .returning('*')
      .execute();

    return result.raw;
  }
}
