import { ExperimentSegment } from '../models/ExperimentSegment';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(ExperimentSegment)
export class ExperimentSegmentRepository extends Repository<ExperimentSegment> {
  public async updateExperimentSegment(
    segmentId: string,
    segmentPoint: string,
    segmentDoc: Partial<ExperimentSegment>
  ): Promise<ExperimentSegment> {
    const result = await this.createQueryBuilder('segment')
      .update()
      .set(segmentDoc)
      .where('id = :id AND point= :point', { id: segmentId, point: segmentPoint })
      .returning('*')
      .execute();

    return result.raw[0];
  }

  public async insertSegments(segmentDocs: ExperimentSegment[]): Promise<ExperimentSegment[]> {
    const result = await this.createQueryBuilder()
      .insert()
      .values(segmentDocs)
      .returning('*')
      .execute();

    return result.raw;
  }
}
