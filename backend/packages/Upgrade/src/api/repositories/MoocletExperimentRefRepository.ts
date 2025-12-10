import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { MoocletExperimentRef } from '../models/MoocletExperimentRef';
import { EXPERIMENT_STATE } from 'upgrade_types';

@EntityRepository(MoocletExperimentRef)
export class MoocletExperimentRefRepository extends Repository<MoocletExperimentRef> {
  public async getRefsForActivelyEnrollingExperiments(): Promise<MoocletExperimentRef[]> {
    return this.createQueryBuilder('moocletExperimentRef')
      .leftJoinAndSelect('moocletExperimentRef.versionConditionMaps', 'versionConditionMaps')
      .leftJoinAndSelect('moocletExperimentRef.experiment', 'experiment')
      .where('experiment.state = :status', { status: EXPERIMENT_STATE.ENROLLING })
      .getMany();
  }

  public async findActivelyEnrollingMoocletExperimentsByContextSiteTarget(
    context: string,
    site: string,
    target: string
  ): Promise<MoocletExperimentRef[]> {
    return this.createQueryBuilder('moocletExperimentRef')
      .leftJoinAndSelect('moocletExperimentRef.versionConditionMaps', 'versionConditionMaps')
      .leftJoinAndSelect('moocletExperimentRef.experiment', 'experiment')
      .leftJoinAndSelect('experiment.partitions', 'decisionPoint')
      .where('experiment.state = :status', { status: EXPERIMENT_STATE.ENROLLING })
      .andWhere(':context = ANY(experiment.context)', { context })
      .andWhere('decisionPoint.site = :site', { site })
      .andWhere('decisionPoint.target = :target', { target })
      .getMany();
  }
}
