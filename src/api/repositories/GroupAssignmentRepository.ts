import { Repository, EntityRepository, InsertResult } from 'typeorm';
import { GroupAssignment } from '../models/GroupAssignment';

@EntityRepository(GroupAssignment)
export class GroupAssignmentRepository extends Repository<GroupAssignment> {
  public findExperiment(
    groupIds: string[],
    experimentIds: string[]
  ): Promise<GroupAssignment[]> {
    return this.createQueryBuilder('groupAssignment')
      .leftJoinAndSelect('groupAssignment.condition', 'condition')
      .where(
        'groupAssignment.groupId IN (:...groupIds) AND groupAssignment.experimentId IN (:...experimentIds)',
        {
          groupIds,
          experimentIds,
        }
      )
      .getMany();
  }

  public saveRawJson(rawData: GroupAssignment): Promise<InsertResult> {
    return this.createQueryBuilder('groupAssignment')
      .insert()
      .into(GroupAssignment)
      .values(rawData)
      .returning('*')
      .execute();
  }
}
