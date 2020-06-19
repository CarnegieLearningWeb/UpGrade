import { JsonController, Get, Post, Body, Authorized, ContentType, Param, Header } from 'routing-controllers';
import { AnalyticsService } from '../services/AnalyticsService';
import { IExperimentEnrollmentStats, IExperimentEnrollmentDetailStats } from 'upgrade_types';
import { EnrollmentAnalyticsValidator } from './validators/EnrollmentAnalyticsValidator';
import { EnrollmentAnalyticsDateValidator } from './validators/EnrollmentAnalyticsDateValidator';
import { EnrollmentDetailAnalyticsValidator } from './validators/EnrollmentDetailAnalyticsValidator';

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
    return this.auditService.getEnrollments(auditParams.experimentIds);
  }

  /**
   * @swagger
   * /stats/enrolment/detail:
   *    post:
   *       description: Get Enrollment Analytics Detail
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
   *       tags:
   *         - Analytics
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Analytics For Experiment Enrollment Detail
   */
  @Post('/enrolment/detail')
  public async analyticsDetailService(
    @Body({ validate: { validationError: { target: false, value: false } } })
    auditParams: EnrollmentDetailAnalyticsValidator
  ): Promise<IExperimentEnrollmentDetailStats> {
    return this.auditService.getDetailEnrolment(auditParams.experimentId);
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
   *              dateEnum:
   *               type: string
   *               enum: [last_seven_days, last_three_months, last_six_months, last_twelve_months]
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
    return this.auditService.getEnrolmentStatsByDate(auditParams.experimentId, auditParams.dateEnum);
  }

  /**
   * @swagger
   * /stats/csv/{experimentId}:
   *    get:
   *       description: Get report by experimentId
   *       parameters:
   *         - in: path
   *           name: experimentId
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Analytics
   *       responses:
   *          '200':
   *            description: Get Report by Experiment Id
   */
  @Get('/csv/:experimentId')
  @ContentType('text/csv')
  @Header('Content-disposition', 'attachment; filename="experiment.csv"')
  public async downloadCSV(@Param('experimentId') experimentId: string): Promise<string> {
    return this.auditService.getCSVData(experimentId);
  }
}
