import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { PreviewGroupAssignment } from '../models/PreviewGroupAssignment';
import repositoryError from './utils/repositoryError';

type PreviewGroupAssignmentInput = Omit<PreviewGroupAssignment, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(PreviewGroupAssignment)
export class PreviewGroupAssignmentRepository extends Repository<PreviewGroupAssignment> {
  public findExperiment(groupIds: string[], experimentIds: string[]): Promise<PreviewGroupAssignment[]> {
    return this.createQueryBuilder('previewGroupAssignment')
      .leftJoinAndSelect('previewGroupAssignment.condition', 'condition')
      .where(
        'previewGroupAssignment.groupId IN (:...groupIds) AND previewGroupAssignment.experimentId IN (:...experimentIds)',
        {
          groupIds,
          experimentIds,
        }
      )
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewGroupAssignmentRepository',
          'findExperiment',
          { groupIds, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async deleteByExperimentId(
    experimentId: string,
    entityManager: EntityManager
  ): Promise<PreviewGroupAssignment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(PreviewGroupAssignment)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewGroupAssignmentRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async saveRawJson(rawData: PreviewGroupAssignmentInput): Promise<PreviewGroupAssignment> {
    const result = await this.createQueryBuilder('previewGroupAssignment')
      .insert()
      .into(PreviewGroupAssignment)
      .values(rawData)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewGroupAssignmentRepository',
          'saveRawJson',
          { rawData },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
