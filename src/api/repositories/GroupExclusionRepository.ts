import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { GroupExclusion } from '../models/GroupExclusion';

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
      .execute();

    return result.raw;
  }

  public async deleteByExperimentId(experimentId: string, entityManager: EntityManager): Promise<GroupExclusion[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(GroupExclusion)
      .where('experimentId = :experimentId', { experimentId })
      .execute();

    return result.raw;
  }

  public findExcluded(groupIds: string[], experimentIds: string[]): Promise<GroupExclusion[]> {
    return this.createQueryBuilder('groupExclusion')
      .where('groupExclusion.groupId IN (:...groupIds) AND groupExclusion.experimentId IN (:...experimentIds)', {
        groupIds,
        experimentIds,
      })
      .getMany();
  }
}
