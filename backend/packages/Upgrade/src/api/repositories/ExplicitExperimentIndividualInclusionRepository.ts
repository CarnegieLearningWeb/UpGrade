import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExplicitExperimentIndividualInclusion)
export class ExplicitExperimentIndividualInclusionRepository extends Repository<ExplicitExperimentIndividualInclusion> {
  public async findAllUsers(): Promise<ExplicitExperimentIndividualInclusion[]> {
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
        throw errorMsgString;
      });
  }

  public async findOneById(userId: string, experimentId: string): Promise<ExplicitExperimentIndividualInclusion> {
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
        throw errorMsgString;
      });
  }

  public async insertExplicitExperimentIndividualInclusion(
    data: Array<Partial<ExplicitExperimentIndividualInclusion>>,
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
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteById(userId: string, experimentId: string): Promise<ExplicitExperimentIndividualInclusion> {
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
        throw errorMsgString;
      });

    return result.raw;
  }
}
