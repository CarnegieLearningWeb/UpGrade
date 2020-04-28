import { JsonController, Get, Post, Body, Authorized, ContentType, Param, Header } from 'routing-controllers';
import { AnalyticsService } from '../services/AnalyticsService';
import { IExperimentEnrollmentStats } from 'upgrade_types';
import { EnrollmentAnalyticsValidator } from './validators/EnrollmentAnalyticsValidator';
import { EnrollmentAnalyticsDateValidator } from './validators/EnrollmentAnalyticsDateValidator';

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
   * /stats/enrolment:
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
  @Post('/enrolment')
  public async analyticsService(
    @Body({ validate: { validationError: { target: false, value: false } } }) auditParams: EnrollmentAnalyticsValidator
  ): Promise<IExperimentEnrollmentStats[]> {
    return this.auditService.getStats(auditParams.experimentIds);
  }

  /**
   * @swagger
   * /stats/enrolment/date:
   *    post:
   *       description: Get Enrollment Analytics By Date
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: props
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *              experimentId:
   *               type: string
   *              fromDate:
   *               type: string
   *              toDate:
   *               type: string
   *       tags:
   *         - Analytics
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Analytics For Experiment Enrollment
   */
  @Post('/enrolment/date')
  public async enrolmentByDate(
    @Body({ validate: { validationError: { target: false, value: false } } })
    auditParams: EnrollmentAnalyticsDateValidator
  ): Promise<any> {
    return this.auditService.getEnrolmentStatsByDate(
      auditParams.experimentId,
      auditParams.fromDate,
      auditParams.toDate
    );
  }

  @Get('/csv/:experimentId')
  @ContentType('text/cvs')
  @Header('Content-disposition', 'attachment; filename=testing.csv')
  public async downloadCSV(@Param('experimentId') experimentId: string): Promise<any> {
    return this.auditService.getCSVData(experimentId);
  }
}
