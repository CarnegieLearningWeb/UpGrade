import { In, Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { GroupEnrollment } from '../models/GroupEnrollment';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(GroupEnrollment)
export class GroupEnrollmentRepository extends Repository<GroupEnrollment> {
  public findEnrollments(groupIds: string[], experimentIds: string[]): Promise<GroupEnrollment[]> {
    return this.find({
      where: { experimentId: In(experimentIds), groupId: In(groupIds) },
      select: ['groupId', 'experimentId', 'conditionId'],
    });
  }

  public async deleteGroupEnrollment(id: string, logger: UpgradeLogger): Promise<GroupEnrollment[]> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(GroupEnrollment)
      .where('groupId=:id', { id })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('GroupEnrollmentRepository', 'deleteGroupEnrollment', { id }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
