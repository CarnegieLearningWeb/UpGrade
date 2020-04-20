import { JsonController, Post, Body, Authorized } from 'routing-controllers';
import { AnalyticsService } from '../services/AnalyticsService';
import { IExperimentEnrollmentStats } from 'upgrade_types';

interface IExperimentParams {
  experimentIds: string[];
}

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Get Experiment Analytics Information
 */
@Authorized()
@JsonController('/stats')
export class AnalyticsController {
  constructor(public auditService: AnalyticsService) {}

  /**
   * @swagger
   * /stats:
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
  public async analyticsService(@Body() auditParams: IExperimentParams): Promise<IExperimentEnrollmentStats[]> {
    return this.auditService.getStats(auditParams.experimentIds);
  }
}
