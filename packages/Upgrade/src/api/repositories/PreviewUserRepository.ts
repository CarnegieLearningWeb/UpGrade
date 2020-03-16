import { Repository, EntityRepository } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { PreviewUser } from '../models/PreviewUser';

type UserInput = Omit<PreviewUser, 'createdAt' | 'updatedAt' | 'versionNumber'>;

@EntityRepository(PreviewUser)
export class PreviewUserRepository extends Repository<PreviewUser> {
  public async saveRawJson(rawData: UserInput): Promise<PreviewUser> {
    const result = await this.createQueryBuilder('previewUser')
      .insert()
      .into(PreviewUser)
      .values(rawData)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('PreviewUserRepository', 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteById(id: string): Promise<PreviewUser> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(PreviewUser)
      .where('id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('PreviewUserRepository', 'deleteById', { id }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async findOneById(id: string): Promise<PreviewUser | undefined> {
    return this.createQueryBuilder()
      .where('id=:id', { id })
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('PreviewUserRepository', 'findOne', { id }, errorMsg);
        throw new Error(errorMsgString);
      });
  }
}
