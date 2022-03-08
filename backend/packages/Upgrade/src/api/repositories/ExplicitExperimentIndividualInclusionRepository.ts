import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(ExplicitExperimentIndividualInclusion)
export class ExplicitExperimentIndividualInclusionRepository extends Repository<ExplicitExperimentIndividualInclusion> {
  public async findAllUsers(logger: UpgradeLogger): Promise<ExplicitExperimentIndividualInclusion[]> {
    return this.createQueryBuilder('explicitExperimentIndividualInclusion')
      .leftJoinAndSelect('explicitExperimentIndividualInclusion.experiment', 'experiment')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'explicitExperimentIndividualInclusionRepository',
          'findAllUsers',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async findOneById(userId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualInclusion> {
    return this.createQueryBuilder('explicitExperimentIndividualInclusion')
      .leftJoinAndSelect('explicitExperimentIndividualInclusion.experiment', 'experiment')
      .where('experiment.id=:experimentId',{experimentId})
      .andWhere({userId})
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentIndividualInclusionRepository',
          'findOneById',
          { userId, experimentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertExplicitExperimentIndividualInclusion(
    data: Array<Partial<ExplicitExperimentIndividualInclusion>>,
    logger: UpgradeLogger
  ): Promise<ExplicitExperimentIndividualInclusion[]> {
    const result = await this.createQueryBuilder('explicitExperimentIndividualInclusion')
      .insert()
      .into(ExplicitExperimentIndividualInclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentIndividualInclusionRepository',
          'insertExplicitExperimentIndividualInclusion',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteById(userId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualInclusion> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExplicitExperimentIndividualInclusion)
      .where('userId=:userId AND experiment.id=:experimentId', { userId, experimentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentIndividualInclusionRepository',
          'deleteById',
          { userId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
