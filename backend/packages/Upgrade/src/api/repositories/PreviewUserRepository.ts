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
        throw errorMsgString;
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
        throw errorMsgString;
      });

    return result.raw;
  }

  public async findOneById(id: string): Promise<PreviewUser | undefined> {
    return this.createQueryBuilder('user')
      .innerJoinAndSelect('user.assignments', 'assignments')
      .innerJoin('assignments.experiment', 'experiment')
      .addSelect(['experiment.id', 'experiment.name'])
      .innerJoin('assignments.experimentCondition', 'experimentCondition')
      .addSelect(['experimentCondition.id', 'experimentCondition.conditionCode'])
      .where('user.id=:id', { id })
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('PreviewUserRepository', 'findOneById', { id }, errorMsg);
        throw errorMsgString;
      });
  }

  public async findWithNames(): Promise<PreviewUser[]> {
    return this.createQueryBuilder('user')
      .innerJoinAndSelect('user.assignments', 'assignments')
      .innerJoin('assignments.experiment', 'experiment')
      .addSelect(['experiment.id', 'experiment.name'])
      .innerJoin('assignments.experimentCondition', 'experimentCondition')
      .addSelect(['experimentCondition.id', 'experimentCondition.conditionCode'])
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('PreviewUserRepository', 'findWithNames', {}, errorMsg);
        throw errorMsgString;
      });
  }

  public async findPaginated(skip: number, take: number): Promise<PreviewUser[] | undefined> {
    return this.createQueryBuilder('user')
      .skip(skip)
      .take(take)
      .orderBy('user.createdAt', 'DESC')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('PreviewUserRepository', 'findPaginated', { skip, take }, errorMsg);
        throw errorMsgString;
      });
  }
}
