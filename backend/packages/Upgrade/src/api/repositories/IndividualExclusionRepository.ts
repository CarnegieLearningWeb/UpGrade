import { EntityRepository, Repository } from 'typeorm';
import { IndividualExclusion } from '../models/IndividualExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(IndividualExclusion)
export class IndividualExclusionRepository extends Repository<IndividualExclusion> {
  public async saveRawJson(
    rawDataArray: Array<Omit<IndividualExclusion, 'createdAt' | 'updatedAt' | 'versionNumber' | 'id'>>
  ): Promise<IndividualExclusion[]> {
    const newRawDataArray = rawDataArray.map((rawData) => {
      const id = `${rawData.experiment.id}_${rawData.user.id}`;
      return { id, ...rawData };
    });
    const result = await this.createQueryBuilder('individualExclusion')
      .insert()
      .into(IndividualExclusion)
      .values(newRawDataArray)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawDataArray }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async isUserExcludedFromExperiment(userId: string, experimentId: string): Promise<boolean> {
    const excludedCount = await this.count({
      where: { experiment: { id: experimentId }, user: { id: userId } },
    });
    return excludedCount > 0;
  }

  public async findExcluded(userId: string, experimentIds: string[]): Promise<IndividualExclusion[]> {
    const primaryKeys = experimentIds.map((experimentId) => {
      return `${experimentId}_${userId}`;
    });
    return await this.createQueryBuilder('individualExclusion')
      .leftJoinAndSelect('individualExclusion.experiment', 'experiment')
      .leftJoinAndSelect('individualExclusion.user', 'user')
      .whereInIds(primaryKeys)
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findExcluded',
          { userId, experimentIds },
          errorMsg
        );
        throw errorMsgString;
      });
  }

  public async findExcludedByExperimentId(experimentId: string): Promise<IndividualExclusion[]> {
    return await this.createQueryBuilder('individualExclusion')
      .leftJoinAndSelect('individualExclusion.experiment', 'experiment')
      .leftJoinAndSelect('individualExclusion.user', 'user')
      .where('experiment.id = :experimentId', { experimentId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findExcludedByExperimentId',
          { experimentId },
          errorMsg
        );
        throw errorMsgString;
      });
  }

  public async deleteExperimentsForUserId(userId: string, experimentIds: string[]): Promise<IndividualExclusion[]> {
    const primaryKeys = experimentIds.map((experimentId) => {
      return `${experimentId}_${userId}`;
    });
    const result = await this.createQueryBuilder()
      .delete()
      .from(IndividualExclusion)
      .whereInIds(primaryKeys)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'deleteExperimentsForUserId',
          { userId, experimentIds },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw;
  }
}
