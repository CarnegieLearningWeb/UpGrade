import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { ThompsonSamplingReward } from '../models/ThompsonSamplingReward';

@EntityRepository(ThompsonSamplingReward)
export class ThompsonSamplingRewardRepository extends Repository<ThompsonSamplingReward> {
  /**
   * Every reward recorded for the given conditions, oldest first: the order they reached the
   * posteriors. Selects only the columns a replay needs, since an experiment can collect many
   * rewards, and never `userId`, so user identifiers can't reach the replay response. `id` breaks
   * ties between rewards recorded in the same instant so the order is stable.
   */
  public async findByConditionIdsInArrivalOrder(conditionIds: string[]): Promise<ThompsonSamplingReward[]> {
    if (conditionIds.length === 0) {
      return [];
    }
    return this.createQueryBuilder('reward')
      .select(['reward.id', 'reward.conditionId', 'reward.success', 'reward.createdAt'])
      .where('reward.conditionId IN (:...conditionIds)', { conditionIds })
      .orderBy('reward.createdAt', 'ASC')
      .addOrderBy('reward.id', 'ASC')
      .getMany();
  }
}
