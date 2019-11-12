import { Repository, EntityRepository, InsertResult } from 'typeorm';
import { GroupExclusion } from '../models/GroupExclusion';

@EntityRepository(GroupExclusion)
export class GroupExclusionRepository extends Repository<GroupExclusion> {
  public saveRawJson(rawData: GroupExclusion): Promise<InsertResult> {
    return this.createQueryBuilder('groupExclusion')
      .insert()
      .into(GroupExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .execute();
  }
}
