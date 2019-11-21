import { Repository, EntityRepository, InsertResult } from 'typeorm';
import { User } from '../models/User';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  public saveRawJson(rawData: User): Promise<InsertResult> {
    return this.createQueryBuilder('user')
      .insert()
      .into(User)
      .values(rawData)
      .onConflict(`("id") DO UPDATE SET "group" = :group`)
      .setParameter('group', rawData.group)
      .returning('*')
      .execute();
  }
}
