import { Service } from 'typedi';

@Service()
export default class MoocletRewardsServiceMock {
  public async getRewardsSummaryForExperiment(experimentId: string, logger: any): Promise<any> {
    return [
      {
        conditionCode: 'Control',
        successes: 10,
        failures: 5,
        total: 15,
        successRate: '66.7%',
        order: 0,
      },
      {
        conditionCode: 'Treatment',
        successes: 8,
        failures: 7,
        total: 15,
        successRate: '53.3%',
        order: 1,
      },
    ];
  }
}
