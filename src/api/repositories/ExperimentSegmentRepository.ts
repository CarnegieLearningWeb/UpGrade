import { ExperimentSegment } from '../models/ExperimentSegment';
import { Repository, EntityRepository, EntityManager } from 'typeorm';

@EntityRepository(ExperimentSegment)
export class ExperimentSegmentRepository extends Repository<ExperimentSegment> {
  public async upsertExperimentSegment(
    segmentDoc: Partial<ExperimentSegment>,
    entityManager: EntityManager
  ): Promise<ExperimentSegment> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ExperimentSegment)
      .values(segmentDoc)
      .onConflict(`("id") DO UPDATE SET "name" = :name, "description" = :description`)
      .setParameter('name', segmentDoc.name)
      .setParameter('description', segmentDoc.description)
      .returning('*')
      .execute();

    return result.raw[0];
  }

  // public async updateExperimentSegment(
  //   segmentId: string,
  //   segmentPoint: string,
  //   segmentDoc: Partial<ExperimentSegment>
  // ): Promise<ExperimentSegment> {
  //   const result = await this.createQueryBuilder('segment')
  //     .update()
  //     .set(segmentDoc)
  //     .where('id = :id AND point= :point', { id: segmentId, point: segmentPoint })
  //     .returning('*')
  //     .execute();

  //   return result.raw[0];
  // }

  public async deleteByIds(ids: string[], entityManager: EntityManager): Promise<ExperimentSegment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentSegment)
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.raw;
  }

  public async insertSegments(
    segmentDocs: ExperimentSegment[],
    entityManager: EntityManager
  ): Promise<ExperimentSegment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ExperimentSegment)
      .values(segmentDocs)
      .returning('*')
      .execute();

    return result.raw;
  }

  public async deleteSegment(id: string, entityManager: EntityManager): Promise<void> {
    entityManager
      .createQueryBuilder()
      .delete()
      .from(ExperimentSegment)
      .where('id = :id', { id })
      .execute();
  }
}
