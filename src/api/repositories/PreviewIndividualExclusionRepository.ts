import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { PreviewIndividualExclusion } from '../models/PreviewIndividualExclusion';
import repositoryError from './utils/repositoryError';

type PreviewIndividualExclusionInput = Omit<PreviewIndividualExclusion, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(PreviewIndividualExclusion)
export class PreviewIndividualExclusionRepository extends Repository<PreviewIndividualExclusion> {
  public async saveRawJson(rawData: PreviewIndividualExclusionInput[]): Promise<PreviewIndividualExclusion[]> {
    const result = await this.createQueryBuilder('previewIndividualExclusion')
      .insert()
      .into(PreviewIndividualExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewIndividualExclusionRepository',
          'saveRawJson',
          { rawData },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public findExcluded(userId: string, experimentIds: string[]): Promise<PreviewIndividualExclusion[]> {
    return this.createQueryBuilder('previewIndividualExclusion')
      .where(
        'previewIndividualExclusion.userId = :userId AND previewIndividualExclusion.experimentId IN (:...experimentIds)',
        {
          userId,
          experimentIds,
        }
      )
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewIndividualExclusionRepository',
          'findExcluded',
          { userId, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async deleteByExperimentId(
    experimentId: string,
    entityManager: EntityManager
  ): Promise<PreviewIndividualExclusion[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(PreviewIndividualExclusion)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewIndividualExclusionRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
