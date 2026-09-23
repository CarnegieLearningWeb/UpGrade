import { EntityManager, Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { ConditionPosteriorState } from '../models/ConditionPosteriorState';
import { ExperimentCondition } from '../models/ExperimentCondition';

@EntityRepository(ConditionPosteriorState)
export class ConditionPosteriorStateRepository extends Repository<ConditionPosteriorState> {
  public async findByExperimentIdForUpdate(
    manager: EntityManager,
    experimentId: string
  ): Promise<ConditionPosteriorState[]> {
    return manager
      .createQueryBuilder(ConditionPosteriorState, 'state')
      .innerJoin(ExperimentCondition, 'condition', 'condition.id = state.conditionId')
      .where('condition.experimentId = :experimentId', { experimentId })
      .orderBy('state.id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();
  }

  public async findByConditionId(conditionId: string): Promise<ConditionPosteriorState> {
    return this.createQueryBuilder('state').where('state.conditionId = :conditionId', { conditionId }).getOne();
  }
}
