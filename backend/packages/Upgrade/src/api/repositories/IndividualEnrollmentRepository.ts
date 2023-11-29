import { EntityRepository, Repository, In, DeleteResult } from 'typeorm';
import { IndividualEnrollment } from '../models/IndividualEnrollment';
@EntityRepository(IndividualEnrollment)
export class IndividualEnrollmentRepository extends Repository<IndividualEnrollment> {
  public findEnrollments(userId: string, experimentIds: string[]): Promise<IndividualEnrollment[]> {
    return this.find({
      where: { experiment: { id: In(experimentIds) }, user: { id: userId } },
      relations: ['experiment', 'condition', 'partition'],
    });
  }

  public async deleteEnrollmentsOfUserInExperiments(userId: string, experimentIds: string[]): Promise<DeleteResult> {
    return this.delete({
      user: { id: userId },
      experiment: { id: In(experimentIds) },
    });
  }

  public async getEnrollmentCountForExperiment(experimentId: string): Promise<number> {
    const data: Array<{ count: number }> = await this.createQueryBuilder('enrollment')
      .select('COUNT(DISTINCT("userId"))::int as count')
      .where('"experimentId" = :experimentId', { experimentId })
      .execute();

    return data[0].count;
  }
}
