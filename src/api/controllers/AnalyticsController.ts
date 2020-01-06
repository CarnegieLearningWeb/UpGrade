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

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Get Experiment Analytics Information
 */
@JsonController('/stats')
export class AnalyticsController {
  constructor(public auditService: AnalyticsService) {}

  /**
   * @swagger
   * /:
   *    post:
   *       description: Get Enrollment Analytics
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: props
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *              experimentIds:
   *               type: array
   *               items:
   *                type: string
   *       tags:
   *         - Analytics
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Analytics For Experiment Enrollment
   */
  @Post('/')
  public async analyticsService(@Body() auditParams: IExperimentParams): Promise<ExperimentEnrollmentStats[]> {
    return this.auditService.getStats(auditParams.experimentIds);
  }
}
