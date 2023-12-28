import { Repository } from 'typeorm';
import { ExperimentUser } from '../models/ExperimentUser';
import repositoryError from './utils/repositoryError';
import { InjectRepository } from 'typeorm-typedi-extensions';

type UserInput = Omit<ExperimentUser, 'createdAt' | 'updatedAt' | 'versionNumber' | 'workingGroup'>;

@InjectRepository(ExperimentUser)
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
        throw errorMsgString;
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
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentUserRepository',
          'updateWorkingGroup',
          { userId, workingGroup },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw[0];
  }
}
