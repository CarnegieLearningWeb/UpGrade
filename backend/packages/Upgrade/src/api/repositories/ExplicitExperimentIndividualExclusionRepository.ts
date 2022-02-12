import { Repository, EntityRepository } from 'typeorm';
import {  ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExplicitExperimentIndividualExclusion)
export class ExplicitExperimentIndividualExclusionRepository extends Repository<ExplicitExperimentIndividualExclusion> {
  public async findAllUsers(): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.createQueryBuilder('explicitExperimentIndividualExclusionRepository')
    .leftJoinAndSelect('explicitExperimentIndividualExclusionRepository.experiment', 'experiment')
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
    const explicitExperimentIndividualExclusionData = await this.createQueryBuilder('explicitExperimentIndividualExclusionRepository')
      .leftJoin('explicitExperimentIndividualExclusionRepository.experiment', 'experiment')
      .where('userId=:userId AND experiment.id=:experimentId', { userId, experimentId })
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

    return explicitExperimentIndividualExclusionData;
  }

  public async insertExplicitExperimentIndividualExclusion(
    data: Array<Partial<ExplicitExperimentIndividualExclusion>>,
  ): Promise<ExplicitExperimentIndividualExclusion[]> {
    const result = await this.createQueryBuilder('explicitExperimentIndividualExclusionRepository')
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