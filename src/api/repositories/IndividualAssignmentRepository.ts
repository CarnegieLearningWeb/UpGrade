import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { IndividualAssignment } from '../models/IndividualAssignment';
import repositoryError from './utils/repositoryError';

type IndividualAssignmentInput = Omit<IndividualAssignment, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(IndividualAssignment)
export class IndividualAssignmentRepository extends Repository<IndividualAssignment> {
  public findAssignment(userId: string, experimentIds: string[]): Promise<IndividualAssignment[]> {
    return this.createQueryBuilder('individualAssignment')
      .leftJoinAndSelect('individualAssignment.condition', 'condition')
      .where('individualAssignment.userId = :userId AND individualAssignment.experimentId IN (:...experimentIds)', {
        userId,
        experimentIds,
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'IndividualAssignmentRepository',
          'findAssignment',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async saveRawJson(rawData: IndividualAssignmentInput): Promise<IndividualAssignment> {
    const result = await this.createQueryBuilder('individualAssignment')
      .insert()
      .into(IndividualAssignment)
      .values(rawData)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('IndividualAssignmentRepository', 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteByExperimentId(
    experimentId: string,
    entityManager: EntityManager
  ): Promise<IndividualAssignment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(IndividualAssignment)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'IndividualAssignmentRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
