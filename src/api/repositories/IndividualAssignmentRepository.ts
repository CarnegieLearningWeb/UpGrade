import { Repository, EntityRepository, InsertResult } from 'typeorm';
import { IndividualAssignment } from '../models/IndividualAssignment';

@EntityRepository(IndividualAssignment)
export class IndividualAssignmentRepository extends Repository<
  IndividualAssignment
> {
  public findAssignment(
    userId: string,
    experimentIds: string[]
  ): Promise<IndividualAssignment[]> {
    return this.createQueryBuilder('individualAssignment')
      .leftJoinAndSelect('individualAssignment.condition', 'condition')
      .where(
        'individualAssignment.userId = :userId AND individualAssignment.experimentId IN (:...experimentIds)',
        {
          userId,
          experimentIds,
        }
      )
      .getMany();
  }

  public saveRawJson(rawData: IndividualAssignment): Promise<InsertResult> {
    return this.createQueryBuilder('individualAssignment')
      .insert()
      .into(IndividualAssignment)
      .values(rawData)
      .returning('*')
      .execute();
  }
}
