import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { PreviewGroupExclusion } from '../models/PreviewGroupExclusion';
import repositoryError from './utils/repositoryError';

type PreviewGroupExclusionInput = Omit<PreviewGroupExclusion, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(PreviewGroupExclusion)
export class PreviewGroupExclusionRepository extends Repository<PreviewGroupExclusion> {
  public async saveRawJson(rawData: PreviewGroupExclusionInput[]): Promise<PreviewGroupExclusion> {
    const result = await this.createQueryBuilder('previewGroupExclusion')
      .insert()
      .into(PreviewGroupExclusion)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('PreviewGroupExclusionRepository', 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteByExperimentId(
    experimentId: string,
    entityManager: EntityManager
  ): Promise<PreviewGroupExclusion[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(PreviewGroupExclusion)
      .where('experimentId = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewGroupExclusionRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public findExcluded(groupIds: string[], experimentIds: string[]): Promise<PreviewGroupExclusion[]> {
    return this.createQueryBuilder('previewGroupExclusion')
      .where(
        'previewGroupExclusion.groupId IN (:...groupIds) AND previewGroupExclusion.experimentId IN (:...experimentIds)',
        {
          groupIds,
          experimentIds,
        }
      )
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'PreviewGroupExclusionRepository',
          'findExcluded',
          { groupIds, experimentIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }
}
