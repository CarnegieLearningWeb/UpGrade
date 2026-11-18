import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { ThompsonSamplingReward } from '../models/ThompsonSamplingReward';

export interface RewardOutcomeCounts {
  conditionId: string;
  successes: number;
  failures: number;
}

@EntityRepository(ThompsonSamplingReward)
export class ThompsonSamplingRewardRepository extends Repository<ThompsonSamplingReward> {
  public async countByConditionIds(conditionIds: string[]): Promise<number> {
    if (conditionIds.length === 0) {
      return 0;
    }
    return this.createQueryBuilder('reward')
      .where('reward.conditionId IN (:...conditionIds)', { conditionIds })
      .getCount();
  }

  /**
   * The rewards recorded for the given conditions, oldest first: the order they reached the
   * posteriors. `skip` leaves out that many of the oldest. Selects only the columns a replay needs,
   * since an experiment can collect many rewards, and never `userId`, so user identifiers can't
   * reach the replay response. `id` breaks ties between rewards recorded in the same instant so the
   * order is stable.
   */
  public async findByConditionIdsInArrivalOrder(conditionIds: string[], skip = 0): Promise<ThompsonSamplingReward[]> {
    if (conditionIds.length === 0) {
      return [];
    }
    return this.createQueryBuilder('reward')
      .select(['reward.id', 'reward.conditionId', 'reward.success', 'reward.createdAt'])
      .where('reward.conditionId IN (:...conditionIds)', { conditionIds })
      .orderBy('reward.createdAt', 'ASC')
      .addOrderBy('reward.id', 'ASC')
      .offset(skip)
      .getMany();
  }

  /**
   * Per-condition success and failure counts for the rewards at arrival positions `first` through
   * `last` (1-based, inclusive), numbered in the same oldest-first order as
   * findByConditionIdsInArrivalOrder. Conditions with no rewards in that range are left out.
   */
  public async countOutcomesByConditionInArrivalRange(
    conditionIds: string[],
    first: number,
    last: number
  ): Promise<RewardOutcomeCounts[]> {
    if (conditionIds.length === 0 || last < first) {
      return [];
    }
    const rows: Array<{ conditionId: string; successes: string; failures: string }> = await this.query(
      `SELECT ranked."conditionId" AS "conditionId",
              COUNT(*) FILTER (WHERE ranked.success) AS successes,
              COUNT(*) FILTER (WHERE NOT ranked.success) AS failures
         FROM (
           SELECT reward."conditionId", reward.success,
                  ROW_NUMBER() OVER (ORDER BY reward."createdAt" ASC, reward.id ASC) AS position
             FROM thompson_sampling_reward reward
            WHERE reward."conditionId" = ANY($1)
         ) ranked
        WHERE ranked.position BETWEEN $2 AND $3
        GROUP BY ranked."conditionId"`,
      [conditionIds, first, last]
    );
    // COUNT(*) comes back from Postgres as a bigint string.
    return rows.map((row) => ({
      conditionId: row.conditionId,
      successes: Number(row.successes),
      failures: Number(row.failures),
    }));
  }
}
