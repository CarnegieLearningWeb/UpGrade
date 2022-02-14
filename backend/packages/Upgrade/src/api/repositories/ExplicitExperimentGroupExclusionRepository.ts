import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExplicitExperimentGroupExclusion)
export class ExplicitExperimentGroupExclusionRepository extends Repository<ExplicitExperimentGroupExclusion> {
  public async findAllGroups(): Promise<ExplicitExperimentGroupExclusion[]> {
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
        throw errorMsgString;
      });
  }

  public async findOneById(id: string, experimentId: string): Promise<ExplicitExperimentGroupExclusion> {
    return this.createQueryBuilder('explicitExperimentGroupExclusion')
      .leftJoinAndSelect('explicitExperimentGroupExclusion.experiment', 'experiment')
      .where('experiment.id=:experimentId',{experimentId})
      .andWhere({id})
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExplicitExperimentGroupExclusionRepository',
          'findOneById',
          { id, experimentId },
          errorMsg
        );
        throw errorMsgString;
      });
  }

  public async insertExplicitExperimentGroupExclusion(
    data: Array<Partial<ExplicitExperimentGroupExclusion>>
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
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteGroup(groupId: string, type: string, experimentId: string): Promise<ExplicitExperimentGroupExclusion | undefined> {
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
        throw errorMsgString;
      });

    return result.raw;
  }
}
