import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { ConditionPosteriorState } from '../models/ConditionPosteriorState';

@EntityRepository(ConditionPosteriorState)
export class ConditionPosteriorStateRepository extends Repository<ConditionPosteriorState> {
  public async findByConfigId(configId: string): Promise<ConditionPosteriorState[]> {
    return this.createQueryBuilder('state')
      .leftJoinAndSelect('state.condition', 'condition')
      .where('state.configId = :configId', { configId })
      .getMany();
  }

  public async findByConditionId(conditionId: string): Promise<ConditionPosteriorState> {
    return this.createQueryBuilder('state').where('state.conditionId = :conditionId', { conditionId }).getOne();
  }
}
