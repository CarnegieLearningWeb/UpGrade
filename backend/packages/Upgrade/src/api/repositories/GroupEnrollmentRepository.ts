import { EntityRepository, In, Repository } from 'typeorm';
import { GroupEnrollment } from '../models/GroupEnrollment';

@EntityRepository(GroupEnrollment)
export class GroupEnrollmentRepository extends Repository<GroupEnrollment> {
  public findEnrollments(groupIds: string[], experimentIds: string[]): Promise<GroupEnrollment[]> {
    return this.find({
      where: { experiment: { id: In(experimentIds) }, groupId: In(groupIds) },
      relations: ['experiment', 'condition'],
    });
  }

  public getEnrollmentCountByCondition(experimentId: string): Promise<Array<{ conditionId: string; count: number }>> {
    return this.createQueryBuilder('enrollment')
      .select(['COUNT(DISTINCT("userId"))::int as count', '"conditionId"'])
      .where('"experimentId" = :experimentId', { experimentId })
      .groupBy('conditionId')
      .execute();
  }
}
