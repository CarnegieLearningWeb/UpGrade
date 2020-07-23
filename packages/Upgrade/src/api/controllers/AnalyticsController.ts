import { JsonController, Post, Body, Authorized } from 'routing-controllers';
import { AnalyticsService } from '../services/AnalyticsService';
import { IExperimentEnrollmentStats, IExperimentEnrollmentDetailStats } from 'upgrade_types';
import { EnrollmentAnalyticsValidator } from './validators/EnrollmentAnalyticsValidator';
import { EnrollmentAnalyticsDateValidator } from './validators/EnrollmentAnalyticsDateValidator';
import { EnrollmentDetailAnalyticsValidator } from './validators/EnrollmentDetailAnalyticsValidator';
import { DataExportValidator } from './validators/DataExportValidator';

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
   * /stats/csv:
   *    post:
   *       description: Get csv files
   *       parameters:
   *         - in: body
   *           name: props
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *              experimentId:
   *                type: string
   *              email:
   *                type: string
   *           description: Get Csv files in given mail id
   *       tags:
   *         - Analytics
   *       responses:
   *          '200':
   *            description: Get CSV files
   */
  @Post('/csv')
  public async downloadCSV(
    @Body({ validate: { validationError: { target: false, value: false } } })
    csvInfo: DataExportValidator
  ): Promise<string> {
    return this.auditService.getCSVData(csvInfo.experimentId, csvInfo.email);
  }
}
