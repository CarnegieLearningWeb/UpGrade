import { Repository, EntityRepository } from 'typeorm';
import { IndividualAssignment } from '../models/IndividualAssignment';

type IndividualAssignmentInput = Omit<IndividualAssignment, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(IndividualAssignment)
export class IndividualAssignmentRepository extends Repository<IndividualAssignment> {
  public findAssignment(userId: string, experimentIds: string[]): Promise<IndividualAssignment[]> {
    return this.createQueryBuilder('individualAssignment')
      .leftJoinAndSelect('individualAssignment.condition', 'condition')
      .where('individualAssignment.userId = :userId AND individualAssignment.experimentId IN (:...experimentIds)', {
        userId,
        experimentIds,
      })
      .getMany();
  }

  public async saveRawJson(rawData: IndividualAssignmentInput): Promise<IndividualAssignment> {
    const result = await this.createQueryBuilder('individualAssignment')
      .insert()
      .into(IndividualAssignment)
      .values(rawData)
      .returning('*')
      .execute();

    return result.raw;
  }
}
