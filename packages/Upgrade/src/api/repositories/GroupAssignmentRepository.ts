import { EntityRepository, Repository, EntityManager } from 'typeorm';
import { GroupAssignment } from '../models/GroupAssignment';
import repositoryError from './utils/repositoryError';

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
          this.constructor.name,
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
          this.constructor.name,
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async saveRawJson(
    rawData: Omit<GroupAssignment, 'createdAt' | 'updatedAt' | 'versionNumber'>
  ): Promise<GroupAssignment> {
    const result = await this.createQueryBuilder('groupAssignment')
      .insert()
      .into(GroupAssignment)
      .values(rawData)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteByExperimentIds(experimentIds: string[]): Promise<GroupAssignment> {
    const result = await this.createQueryBuilder('groupAssignment')
      .delete()
      .from(GroupAssignment)
      .where('groupAssignment.experimentId IN (:...experimentIds)')
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'deleteByExperimentIds',
          { experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
