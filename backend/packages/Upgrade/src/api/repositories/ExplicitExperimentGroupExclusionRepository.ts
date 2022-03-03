import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(ExplicitExperimentGroupExclusion)
export class ExplicitExperimentGroupExclusionRepository extends Repository<ExplicitExperimentGroupExclusion> {
  public async findAllGroups(logger: UpgradeLogger): Promise<ExplicitExperimentGroupExclusion[]> {
    return this.createQueryBuilder('explicitExperimentGroupExclusion')
      .leftJoinAndSelect('explicitExperimentGroupExclusion.experiment', 'experiment')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupExclusionRepository',
          'findAllUsers',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async findOneById(type: string, groupId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupExclusion> {
    return this.createQueryBuilder('explicitExperimentGroupExclusion')
      .leftJoinAndSelect('explicitExperimentGroupExclusion.experiment', 'experiment')
      .where('experiment.id=:experimentId',{experimentId})
      .andWhere({type})
      .andWhere({groupId})
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupExclusionRepository',
          'findOneById',
          { type, groupId, experimentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertExplicitExperimentGroupExclusion(
    data: Array<Partial<ExplicitExperimentGroupExclusion>>,
    logger: UpgradeLogger
  ): Promise<ExplicitExperimentGroupExclusion[]> {
    const result = await this.createQueryBuilder('ExplicitExperimentGroupExclusion')
      .insert()
      .into(ExplicitExperimentGroupExclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupExclusionRepository',
          'insertExplicitExperimentGrouplExclusion',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteGroup(groupId: string, type: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupExclusion | undefined> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExplicitExperimentGroupExclusion)
      .where('groupId=:groupId AND type=:type AND experiment.id=:experimentId', { groupId, type, experimentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupExclusionRepository',
          'deleteGroup',
          { groupId, type, experimentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
