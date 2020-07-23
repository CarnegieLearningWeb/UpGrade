import { EntityRepository, Repository } from 'typeorm';
import { GroupAssignment } from '../models/GroupAssignment';
import repositoryError from './utils/repositoryError';

@EntityRepository(GroupAssignment)
export class GroupAssignmentRepository extends Repository<GroupAssignment> {
  public async findExperiment(groupIds: string[], experimentIds: string[]): Promise<GroupAssignment[]> {
    const primaryKeys = experimentIds.reduce((accu, experimentId) => {
      const selectedPrimaryKey = groupIds.map((groupId) => {
        return `${experimentId}_${groupId}`;
      });
      return [...selectedPrimaryKey, ...accu];
    }, []);

    return this.createQueryBuilder('groupAssignment')
      .leftJoinAndSelect('groupAssignment.condition', 'condition')
      .leftJoinAndSelect('groupAssignment.experiment', 'experiment')
      .whereInIds(primaryKeys)
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

  public async findGroupAssignmentsByExperimentId(experimentId: string): Promise<GroupAssignment[]> {
    return this.createQueryBuilder('groupAssignment')
      .leftJoinAndSelect('groupAssignment.experiment', 'experiment')
      .leftJoinAndSelect('groupAssignment.condition', 'condition')
      .where('experiment.id = :experimentId', { experimentId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findGroupAssignmentsByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async findGroupAssignmentsByConditions(experimentId: string): Promise<GroupAssignment[]> {
    return this.createQueryBuilder('groupAssignment')
      .leftJoinAndSelect('groupAssignment.experiment', 'experiment')
      .select('"groupAssignment"."conditionId"')
      .addSelect('COUNT(*) AS count')
      .addGroupBy('"groupAssignment"."conditionId"')
      .where('experiment.id = :experimentId', {
        experimentId,
      })
      .getRawMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findGroupAssignmentsByConditions',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async saveRawJson(
    rawData: Omit<GroupAssignment, 'createdAt' | 'updatedAt' | 'versionNumber' | 'id'>
  ): Promise<GroupAssignment> {
    const id = `${rawData.experiment.id}_${rawData.groupId}`;
    const result = await this.createQueryBuilder('groupAssignment')
      .insert()
      .into(GroupAssignment)
      .values({ id, ...rawData })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
