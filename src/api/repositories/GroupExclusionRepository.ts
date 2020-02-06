import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { GroupExclusion } from '../models/GroupExclusion';
import repositoryError from './utils/repositoryError';

type GroupExclusionInput = Omit<GroupExclusion, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(GroupExclusion)
export class GroupExclusionRepository extends Repository<GroupExclusion> {
  public async saveRawJson(rawData: GroupExclusionInput[]): Promise<GroupExclusion> {
    const result = await this.createQueryBuilder('groupExclusion')
      .insert()
      .into(GroupExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('GroupExclusionRepository', 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteByExperimentId(experimentId: string, entityManager: EntityManager): Promise<GroupExclusion[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(GroupExclusion)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'GroupExclusionRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public findExcluded(groupIds: string[], experimentIds: string[]): Promise<GroupExclusion[]> {
    return this.createQueryBuilder('groupExclusion')
      .where('groupExclusion.groupId IN (:...groupIds) AND groupExclusion.experimentId IN (:...experimentIds)', {
        groupIds,
        experimentIds,
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'GroupExclusionRepository',
          'findExcluded',
          { groupIds, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }
}
