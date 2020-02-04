import { Repository, EntityRepository } from 'typeorm';
import { User } from '../models/User';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  // public async saveRawJson(rawData: User): Promise<User> {
  //   const result = await this.createQueryBuilder('experimentUser')
  //     .insert()
  //     .into(User)
  //     .values(rawData)
  //     .onConflict(
  //       `("email") DO UPDATE SET "firstName" = :firstName, "lastName" = :lastName, "imageUrl" = :imageUrl, "assignmentWeight" = :assignmentWeight`
  //     )
  //     .setParameter('firstName', rawData.firstName)
  //     .setParameter('lastName', rawData.lastName)
  //     .setParameter('imageUrl', rawData.imageUrl)
  //     .returning('*')
  //     .execute();
  //   return result.raw;
  // }
}
