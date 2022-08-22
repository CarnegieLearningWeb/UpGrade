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
      .onConflict(
        `("email") DO UPDATE SET "firstName" = :firstName, "lastName" = :lastName, "imageUrl" = :imageUrl, "localTimeZone" = :localTimeZone`
      )
      .setParameter('firstName', user.firstName)
      .setParameter('lastName', user.lastName)
      .setParameter('imageUrl', user.imageUrl)
      .setParameter('localTimeZone', user.localTimeZone)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('UserRepository', 'upsertUser', { user }, errorMsg);
        throw errorMsgString;
      });
    return result.raw[0];
  }

  public async updateUserDetails(firstName: string, lastName: string, email: string, role: UserRole): Promise<User> {
    const result = await this.createQueryBuilder('user')
      .update()
      .set({ firstName, lastName, role })
      .where({ email })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'UserRepository',
          'updateUserDetails',
          { firstName, lastName, email, role },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteUserByEmail(email: string): Promise<User> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(User)
      .where('email=:email', { email })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('UserRepository', 'deleteUserByEmail', { email }, errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}
