import { Repository, EntityRepository } from 'typeorm';
import { User } from '../models/User';

type UserInput = Omit<User, 'createdAt' | 'updatedAt' | 'versionNumber'>;

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  public async saveRawJson(rawData: UserInput): Promise<User> {
    const result = await this.createQueryBuilder('user')
      .insert()
      .into(User)
      .values(rawData)
      .onConflict(`("id") DO UPDATE SET "group" = :group`)
      .setParameter('group', rawData.group)
      .returning('*')
      .execute();

    return result.raw;
  }
}
