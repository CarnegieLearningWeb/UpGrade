import { ExperimentPartition } from '../models/ExperimentPartition';
import { Repository, EntityRepository, EntityManager } from 'typeorm';

@EntityRepository(ExperimentPartition)
export class ExperimentPartitionRepository extends Repository<ExperimentPartition> {
  public async upsertExperimentPartition(
    partitionDoc: Partial<ExperimentPartition>,
    entityManager: EntityManager
  ): Promise<ExperimentPartition> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ExperimentPartition)
      .values(partitionDoc)
      .onConflict(`("id") DO UPDATE SET "name" = :name, "description" = :description`)
      .setParameter('name', partitionDoc.name)
      .setParameter('description', partitionDoc.description)
      .returning('*')
      .execute();

    return result.raw[0];
  }

  public async deleteByIds(ids: string[], entityManager: EntityManager): Promise<ExperimentPartition[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentPartition)
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.raw;
  }

  public async insertPartitions(
    partitionsDocs: ExperimentPartition[],
    entityManager: EntityManager
  ): Promise<ExperimentPartition[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ExperimentPartition)
      .values(partitionsDocs)
      .returning('*')
      .execute();

    return result.raw;
  }

  public async deletePartition(id: string, entityManager: EntityManager): Promise<void> {
    entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentPartition)
      .where('id = :id', { id })
      .execute();
  }
}
