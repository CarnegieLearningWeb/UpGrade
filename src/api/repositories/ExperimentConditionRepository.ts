import { ExperimentCondition } from '../models/ExperimentCondition';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(ExperimentCondition)
export class ExperimentConditionRepository extends Repository<ExperimentCondition> {
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

  public async insertConditions(conditionDocs: ExperimentCondition[]): Promise<ExperimentCondition[]> {
    const result = await this.createQueryBuilder()
      .insert()
      .values(conditionDocs)
      .returning('*')
      .execute();

    return result.raw;
  }
}
