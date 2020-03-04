import { Repository, EntityRepository } from 'typeorm';
import { ExperimentUser } from '../models/ExperimentUser';
import repositoryError from './utils/repositoryError';

type UserInput = Omit<ExperimentUser, 'createdAt' | 'updatedAt' | 'versionNumber' | 'workingGroup'>;

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
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentUserRepository', 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async updateWorkingGroup(userId: string, workingGroup: any): Promise<ExperimentUser> {
    const result = await this.createQueryBuilder()
      .update(ExperimentUser)
      .set({
        workingGroup,
      })
      .where('id = :id', { id: userId })
      .returning('*')
      .execute();

    return result.raw[0];
  }

  public async updateGroupMembership(userId: string, group: any): Promise<ExperimentUser> {
    const result = await this.createQueryBuilder()
      .update(ExperimentUser)
      .set({
        group,
      })
      .where('id = :id', { id: userId })
      .returning('*')
      .execute();

    return result.raw[0];
  }
}
