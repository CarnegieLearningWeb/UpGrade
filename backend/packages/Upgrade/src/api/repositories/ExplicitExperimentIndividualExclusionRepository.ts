import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(ExplicitExperimentIndividualExclusion)
export class ExplicitExperimentIndividualExclusionRepository extends Repository<ExplicitExperimentIndividualExclusion> {
  public async findAllUsers(logger: UpgradeLogger): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.createQueryBuilder('explicitExperimentIndividualExclusion')
      .leftJoinAndSelect('explicitExperimentIndividualExclusion.experiment', 'experiment')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentIndividualExclusionRepository',
          'findAllUsers',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async findOneById(userId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualExclusion> {
    return this.createQueryBuilder('explicitExperimentIndividualExclusion')
      .leftJoinAndSelect('explicitExperimentIndividualExclusion.experiment', 'experiment')
      .where('experiment.id=:experimentId',{experimentId})
      .andWhere({userId})
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentIndividualExclusionRepository',
          'findOneById',
          { userId, experimentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertExplicitExperimentIndividualExclusion(
    data: Array<Partial<ExplicitExperimentIndividualExclusion>>,
    logger: UpgradeLogger
  ): Promise<ExplicitExperimentIndividualExclusion[]> {
    const result = await this.createQueryBuilder('explicitExperimentIndividualExclusion')
      .insert()
      .into(ExplicitExperimentIndividualExclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentIndividualExclusionRepository',
          'insertExplicitExperimentIndividualExclusion',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteById(userId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentIndividualExclusion> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExplicitExperimentIndividualExclusion)
      .where('userId=:userId AND experiment.id=:experimentId', { userId, experimentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentIndividualExclusionRepository',
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