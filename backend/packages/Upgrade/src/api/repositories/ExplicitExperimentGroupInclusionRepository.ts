import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(ExplicitExperimentGroupInclusion)
export class ExplicitExperimentGroupInclusionRepository extends Repository<ExplicitExperimentGroupInclusion> {
  public async findAllGroups(logger: UpgradeLogger): Promise<ExplicitExperimentGroupInclusion[]> {
    return this.createQueryBuilder('explicitExperimentGroupInclusion')
      .leftJoinAndSelect('explicitExperimentGroupInclusion.experiment', 'experiment')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupInclusionRepository',
          'findAllUsers',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async findOneById(type: string, groupId: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupInclusion> {
    return this.createQueryBuilder('explicitExperimentGroupInclusion')
      .leftJoinAndSelect('explicitExperimentGroupInclusion.experiment', 'experiment')
      .where('experiment.id=:experimentId',{experimentId})
      .andWhere({type})
      .andWhere({groupId})
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupInclusionRepository',
          'findOneById',
          { type, groupId, experimentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }
  public async insertExplicitExperimentGroupInclusion(
    data: Array<Partial<ExplicitExperimentGroupInclusion>>,
    logger: UpgradeLogger
  ): Promise<ExplicitExperimentGroupInclusion[]> {
    const result = await this.createQueryBuilder('ExplicitExperimentGroupInclusion')
      .insert()
      .into(ExplicitExperimentGroupInclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupInclusionRepository',
          'insertExplicitExperimentGroupInclusion',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteGroup(groupId: string, type: string, experimentId: string, logger: UpgradeLogger): Promise<ExplicitExperimentGroupInclusion | undefined> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExplicitExperimentGroupInclusion)
      .where('groupId=:groupId AND type=:type AND experiment.id=:experimentId', { groupId, type, experimentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupInclusionRepository',
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
