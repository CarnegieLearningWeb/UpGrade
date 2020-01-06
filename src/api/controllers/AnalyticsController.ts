import { JsonController, Post, Body } from 'routing-controllers';
import { AnalyticsService } from '../services/AnalyticsService';

interface IExperimentParams {
  experimentIds: string[];
}
export interface ExperimentEnrollmentStats {
  experiment: {
    id: string;
    users: number;
    group?: number;
    userExcluded: number;
    groupExcluded?: number;
    conditions: [
      {
        conditionId: string;
        uniqueUsers: number;
        uniqueGroups: number;
      }
    ];
  };
  segments: [
    {
      id: string;
      user: number;
      group?: number;
      conditions: [
        {
          id: string;
          user: number;
          group?: number;
        }
      ];
    }
  ];
}

@JsonController('/stats')
export class AnalyticsController {
  constructor(public auditService: AnalyticsService) {}
  @Post('/')
  public async analyticsService(@Body() auditParams: IExperimentParams): Promise<ExperimentEnrollmentStats[]> {
    return this.auditService.getStats(auditParams.experimentIds);
  }
}
