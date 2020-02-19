import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { PreviewIndividualAssignment } from '../models/PreviewIndividualAssignment';
import repositoryError from './utils/repositoryError';

type PreviewIndividualAssignmentInput = Omit<PreviewIndividualAssignment, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(PreviewIndividualAssignment)
export class PreviewIndividualAssignmentRepository extends Repository<PreviewIndividualAssignment> {
  public findAssignment(userId: string, experimentIds: string[]): Promise<PreviewIndividualAssignment[]> {
    return this.createQueryBuilder('previewIndividualAssignment')
      .leftJoinAndSelect('previewIndividualAssignment.condition', 'condition')
      .where(
        'previewIndividualAssignment.userId = :userId AND previewIndividualAssignment.experimentId IN (:...experimentIds)',
        {
          userId,
          experimentIds,
        }
      )
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewIndividualAssignmentRepository',
          'findAssignment',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async saveRawJson(rawData: PreviewIndividualAssignmentInput): Promise<PreviewIndividualAssignment> {
    const result = await this.createQueryBuilder('individualAssignment')
      .insert()
      .into(PreviewIndividualAssignment)
      .values(rawData)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewIndividualAssignmentRepository',
          'saveRawJson',
          { rawData },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteByExperimentId(
    experimentId: string,
    entityManager: EntityManager
  ): Promise<PreviewIndividualAssignment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(PreviewIndividualAssignment)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewIndividualAssignmentRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
