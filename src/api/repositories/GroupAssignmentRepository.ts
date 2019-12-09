import { Repository, EntityRepository } from 'typeorm';
import { GroupAssignment } from '../models/GroupAssignment';

type GroupAssignmentInput = Omit<GroupAssignment, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(GroupAssignment)
export class GroupAssignmentRepository extends Repository<GroupAssignment> {
  public findExperiment(groupIds: string[], experimentIds: string[]): Promise<GroupAssignment[]> {
    return this.createQueryBuilder('groupAssignment')
      .leftJoinAndSelect('groupAssignment.condition', 'condition')
      .where('groupAssignment.groupId IN (:...groupIds) AND groupAssignment.experimentId IN (:...experimentIds)', {
        groupIds,
        experimentIds,
      })
      .getMany();
  }

  public async saveRawJson(rawData: GroupAssignmentInput): Promise<GroupAssignment> {
    const result = await this.createQueryBuilder('groupAssignment')
      .insert()
      .into(GroupAssignment)
      .values(rawData)
      .returning('*')
      .execute();

    return result.raw;
  }
}
