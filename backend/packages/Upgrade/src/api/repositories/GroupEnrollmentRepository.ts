import { EntityRepository, In, Repository } from 'typeorm';
import { GroupEnrollment } from '../models/GroupEnrollment';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(GroupEnrollment)
export class GroupEnrollmentRepository extends Repository<GroupEnrollment> {
  public findEnrollments(groupIds: string[], experimentIds: string[]): Promise<GroupEnrollment[]> {
    return this.find({
      where: { experiment: { id: In(experimentIds) }, groupId: In(groupIds) },
      relations: ['experiment', 'condition'],
    });
  }

  public async deleteGroupEnrollment(id: string, logger: UpgradeLogger): Promise<GroupEnrollment[]> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(GroupEnrollment)
      .where('groupId=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('GroupEnrollmentRepository', 'deleteGroupEnrollment', { id }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
