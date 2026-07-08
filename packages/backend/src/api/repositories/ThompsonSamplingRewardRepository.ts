import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { ThompsonSamplingReward } from '../models/ThompsonSamplingReward';

@EntityRepository(ThompsonSamplingReward)
export class ThompsonSamplingRewardRepository extends Repository<ThompsonSamplingReward> {
  public async findByExperimentAndCondition(
    experimentId: string,
    conditionId: string
  ): Promise<ThompsonSamplingReward[]> {
    return this.createQueryBuilder('reward')
      .where('reward.experimentId = :experimentId', { experimentId })
      .andWhere('reward.conditionId = :conditionId', { conditionId })
      .orderBy('reward.createdAt', 'ASC')
      .getMany();
  }
}
