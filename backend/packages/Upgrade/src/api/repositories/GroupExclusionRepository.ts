import { EntityRepository, Repository } from 'typeorm';
import { GroupExclusion } from '../models/GroupExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(GroupExclusion)
export class GroupExclusionRepository extends Repository<GroupExclusion> {
  public async saveRawJson(
    rawDataArray: Array<Omit<GroupExclusion, 'createdAt' | 'updatedAt' | 'versionNumber' | 'id'>>
  ): Promise<GroupExclusion> {
    const newRawDataArray = rawDataArray.map((rawData) => {
      const id = `${rawData.experiment.id}_${rawData.groupId}`;
      return { id, ...rawData };
    });
    const result = await this.createQueryBuilder('groupExclusion')
      .insert()
      .into(GroupExclusion)
      .values(newRawDataArray)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawDataArray }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async isGroupExcludedFromExperiment(groupId: string, experimentId: string): Promise<boolean> {
    const exclusionCount = await this.count({
      where: { experiment: { id: experimentId }, groupId },
    });
    return exclusionCount > 0;
  }

  public findExcluded(groupIds: string[], experimentIds: string[]): Promise<GroupExclusion[]> {
    const primaryKeys = experimentIds.reduce((accu, experimentId) => {
      const selectedPrimaryKey = groupIds.map((groupId) => {
        return `${experimentId}_${groupId}`;
      });
      return [...selectedPrimaryKey, ...accu];
    }, []);
    return this.createQueryBuilder('groupExclusion')
      .leftJoinAndSelect('groupExclusion.experiment', 'experiment')
      .whereInIds(primaryKeys)
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findExcluded',
          { groupIds, experimentIds },
          errorMsg
        );
        throw errorMsgString;
      });
  }

  public async findExcludedByExperimentId(experimentId: string): Promise<GroupExclusion[]> {
    return this.createQueryBuilder('groupExclusion')
      .leftJoinAndSelect('groupExclusion.experiment', 'experiment')
      .where('experiment.id = :experimentId', { experimentId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findExcludedByExperimentId',
          { experimentId },
          errorMsg
        );
        throw errorMsgString;
      });
  }

  public async deleteByExperimentIds(experimentIds: string[]): Promise<GroupExclusion[]> {
    const result = await this.createQueryBuilder('groupExclusion')
      .delete()
      .from(GroupExclusion)
      .where('groupExclusion.experimentId IN (:...experimentIds)')
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'deleteByExperimentIds',
          { experimentIds },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw;
  }
}
