import { Repository, EntityRepository } from 'typeorm';
import { User } from '../models/User';
import repositoryError from './utils/repositoryError';
import { UserRole } from 'upgrade_types';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  public async upsertUser(user: Partial<User>): Promise<User> {
    const result = await this.createQueryBuilder()
      .insert()
      .into(User)
      .values(user)
      .onConflict(`("email") DO UPDATE SET "firstName" = :firstName, "lastName" = :lastName, "imageUrl" = :imageUrl`)
      .setParameter('firstName', user.firstName)
      .setParameter('lastName', user.lastName)
      .setParameter('imageUrl', user.imageUrl)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('UserRepository', 'upsertUser', { user }, errorMsg);
        throw new Error(errorMsgString);
      });
    return result.raw[0];
  }

  public async updateUserRole(email: string, role: UserRole): Promise<User> {
    const result = await this.createQueryBuilder('user')
      .update()
      .set({ role })
      .where({ email })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('UserRepository', 'updateUserRole', { email, role }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
