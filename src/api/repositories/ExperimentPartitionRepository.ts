import { ExperimentPartition } from '../models/ExperimentPartition';
import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';

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
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'upsertExperimentPartition',
          { partitionDoc },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw[0];
  }

  public async deleteByIds(ids: string[], entityManager: EntityManager): Promise<ExperimentPartition[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentPartition)
      .where('id IN (:...ids)', { ids })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deleteByIds', { ids }, errorMsg);
        throw new Error(errorMsgString);
      });

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
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'insertPartitions', { partitionsDocs }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deletePartition(id: string, entityManager: EntityManager): Promise<void> {
    entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentPartition)
      .where('id = :id', { id })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deletePartition', { id }, errorMsg);
        throw new Error(errorMsgString);
      });
  }

  public async partitionPointAndName(): Promise<Array<Pick<ExperimentPartition, 'name' | 'point'>>> {
    return this.createQueryBuilder('experimentPartition')
      .select(['experimentPartition.point', 'experimentPartition.name'])
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'partitionPointAndName', undefined, errorMsg);
        throw new Error(errorMsgString);
      });
  }
}
