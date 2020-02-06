import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { GroupAssignment } from '../models/GroupAssignment';
import repositoryError from './utils/repositoryError';

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
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'GroupAssignmentRepository',
          'findExperiment',
          { groupIds, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async deleteByExperimentId(experimentId: string, entityManager: EntityManager): Promise<GroupAssignment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(GroupAssignment)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'GroupAssignmentRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async saveRawJson(rawData: GroupAssignmentInput): Promise<GroupAssignment> {
    const result = await this.createQueryBuilder('groupAssignment')
      .insert()
      .into(GroupAssignment)
      .values(rawData)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('GroupAssignmentRepository', 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
