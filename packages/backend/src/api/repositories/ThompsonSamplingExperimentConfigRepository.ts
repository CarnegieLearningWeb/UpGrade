import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { ThompsonSamplingExperimentConfig } from '../models/ThompsonSamplingExperimentConfig';
import { ConditionPosteriorState } from '../models/ConditionPosteriorState';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ASSIGNMENT_ALGORITHM, EXPERIMENT_STATE } from 'upgrade_types';

@EntityRepository(ThompsonSamplingExperimentConfig)
export class ThompsonSamplingExperimentConfigRepository extends Repository<ThompsonSamplingExperimentConfig> {
  public async findByExperimentId(experimentId: string): Promise<ThompsonSamplingExperimentConfig> {
    return this.createQueryBuilder('config')
      .leftJoin(ExperimentCondition, 'condition', 'condition.experimentId = config.experimentId')
      .leftJoinAndMapMany(
        'config.conditionPosteriorStates',
        ConditionPosteriorState,
        'conditionPosteriorStates',
        'conditionPosteriorStates.conditionId = condition.id'
      )
      .where('config.experimentId = :experimentId', { experimentId })
      .getOne();
  }

  /**
   * Same as findByExperimentId, but also joins each posterior state's condition — needed to display
   * the condition's code/order alongside its reward counts (e.g. the rewards summary endpoint).
   */
  public async findByExperimentIdWithConditions(experimentId: string): Promise<ThompsonSamplingExperimentConfig> {
    return this.createQueryBuilder('config')
      .leftJoin(ExperimentCondition, 'experimentCondition', 'experimentCondition.experimentId = config.experimentId')
      .leftJoinAndMapMany(
        'config.conditionPosteriorStates',
        ConditionPosteriorState,
        'conditionPosteriorStates',
        'conditionPosteriorStates.conditionId = experimentCondition.id'
      )
      .leftJoinAndSelect('conditionPosteriorStates.condition', 'condition')
      .where('config.experimentId = :experimentId', { experimentId })
      .getOne();
  }

  public async findByDecisionPoint(
    context: string,
    site: string,
    target: string
  ): Promise<ThompsonSamplingExperimentConfig[]> {
    return (
      this.createQueryBuilder('config')
        .leftJoin(ExperimentCondition, 'experimentCondition', 'experimentCondition.experimentId = config.experimentId')
        .leftJoinAndMapMany(
          'config.conditionPosteriorStates',
          ConditionPosteriorState,
          'conditionPosteriorStates',
          'conditionPosteriorStates.conditionId = experimentCondition.id'
        )
        .leftJoinAndSelect('config.experiment', 'experiment')
        .leftJoinAndSelect('experiment.partitions', 'decisionPoint')
        .where('experiment.state = :state', { state: EXPERIMENT_STATE.ENROLLING })
        // Defends against a stale config row surviving an algorithm change away from Thompson
        // Sampling (deleteConfigIfExists() is the primary fix -- this guards against any config row
        // that outlives it, e.g. one created before that fix shipped).
        .andWhere('experiment.assignmentAlgorithm = :algorithm', { algorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING })
        .andWhere(':context = ANY(experiment.context)', { context })
        .andWhere('decisionPoint.site = :site', { site })
        .andWhere('decisionPoint.target = :target', { target })
        .getMany()
    );
  }
}
