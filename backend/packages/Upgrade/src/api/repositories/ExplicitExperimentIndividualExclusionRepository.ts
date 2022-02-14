import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExplicitExperimentIndividualExclusion)
export class ExplicitExperimentIndividualExclusionRepository extends Repository<ExplicitExperimentIndividualExclusion> {
  public async findAllUsers(): Promise<ExplicitExperimentIndividualExclusion[]> {
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
        throw errorMsgString;
      });
  }

  public async findOneById(userId: string, experimentId: string): Promise<ExplicitExperimentIndividualExclusion> {
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
        throw errorMsgString;
      });
  }

  public async insertExplicitExperimentIndividualExclusion(
    data: Array<Partial<ExplicitExperimentIndividualExclusion>>,
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
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteById(userId: string, experimentId: string): Promise<ExplicitExperimentIndividualExclusion> {
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
        throw errorMsgString;
      });

    return result.raw;
  }
}