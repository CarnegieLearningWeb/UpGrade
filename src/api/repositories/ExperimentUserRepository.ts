import { Repository, EntityRepository } from 'typeorm';
import { ExperimentUser } from '../models/ExperimentUser';

type UserInput = Omit<ExperimentUser, 'createdAt' | 'updatedAt' | 'versionNumber'>;

@EntityRepository(ExperimentUser)
export class ExperimentUserRepository extends Repository<ExperimentUser> {
  public async saveRawJson(rawData: UserInput): Promise<ExperimentUser> {
    const result = await this.createQueryBuilder('experimentUser')
      .insert()
      .into(ExperimentUser)
      .values(rawData)
      .onConflict(`("id") DO UPDATE SET "group" = :group`)
      .setParameter('group', rawData.group)
      .returning('*')
      .execute();

    return result.raw;
  }
}
