import { JsonController, Post, Body, Authorized } from 'routing-controllers';
import { AnalyticsService } from '../services/AnalyticsService';
import { IExperimentEnrollmentStats, IExperimentEnrollmentDetailStats } from 'upgrade_types';
import { EnrollmentAnalyticsValidator } from './validators/EnrollmentAnalyticsValidator';
import { EnrollmentAnalyticsDateValidator } from './validators/EnrollmentAnalyticsDateValidator';
import { EnrollmentDetailAnalyticsValidator } from './validators/EnrollmentDetailAnalyticsValidator';
import { DataExportValidator } from './validators/DataExportValidator';
import { Logger, LoggerInterface } from '../../decorators/Logger';

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Get Experiment Analytics Information
 */
@Authorized()
@JsonController('/stats')
export class AnalyticsController {
  constructor(public auditService: AnalyticsService, @Logger(__filename) private log: LoggerInterface) {}

  /**
   * @swagger
   * /stats/enrollment:
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
   *            schema:
   *              type: array
   *              description: ''
   *              minItems: 1
   *              uniqueItems: true
   *              items:
   *                type: object
   *                required:
   *                  - users
   *                  - groups
   *                  - id
   *                properties:
   *                  users:
   *                    type: number
   *                  groups:
   *                    type: number
   *                  id:
   *                    type: string
   *                    minLength: 1
   */
  @Post('/enrollment')
  public async analyticsService(
    @Body({ validate: { validationError: { target: false, value: false } } }) auditParams: EnrollmentAnalyticsValidator
  ): Promise<IExperimentEnrollmentStats[]> {
    return this.auditService.getEnrollments(auditParams.experimentIds);
  }

  /**
   * @swagger
   * /stats/enrollment/detail:
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
   *            schema:
   *              type: object
   *              properties:
   *                id:
   *                  type: string
   *                  minLength: 1
   *                users:
   *                  type: number
   *                groups:
   *                  type: number
   *                usersExcluded:
   *                  type: number
   *                groupsExcluded:
   *                  type: number
   *                conditions:
   *                  type: array
   *                  uniqueItems: true
   *                  minItems: 1
   *                  items:
   *                    required:
   *                      - id
   *                      - users
   *                      - groups
   *                    properties:
   *                      id:
   *                        type: string
   *                        minLength: 1
   *                      users:
   *                        type: number
   *                      groups:
   *                        type: number
   *                      partitions:
   *                        type: array
   *                        uniqueItems: true
   *                        minItems: 1
   *                        items:
   *                          required:
   *                            - id
   *                            - users
   *                            - groups
   *                          properties:
   *                            id:
   *                              type: string
   *                              minLength: 1
   *                            users:
   *                              type: number
   *                            groups:
   *                              type: number
   */
  @Post('/enrollment/detail')
  public async analyticsDetailService(
    @Body({ validate: { validationError: { target: false, value: false } } })
    auditParams: EnrollmentDetailAnalyticsValidator
  ): Promise<IExperimentEnrollmentDetailStats> {
    return this.auditService.getDetailEnrollment(auditParams.experimentId);
  }

  /**
   * @swagger
   * /stats/enrollment/date:
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
   *            schema:
   *              type: array
   *              description: ''
   *              minItems: 1
   *              uniqueItems: true
   *              items:
   *                type: object
   *                required:
   *                  - date
   *                  - stats
   *                properties:
   *                  date:
   *                    type: string
   *                    minLength: 1
   *                  stats:
   *                    type: object
   *                    properties:
   *                      id:
   *                        type: string
   *                        minLength: 1
   *                      conditions:
   *                        type: array
   *                        uniqueItems: true
   *                        minItems: 1
   *                        items:
   *                          required:
   *                            - id
   *                          properties:
   *                            id:
   *                              type: string
   *                              minLength: 1
   *                            partitions:
   *                              type: array
   *                              uniqueItems: true
   *                              minItems: 1
   *                              items:
   *                                required:
   *                                  - id
   *                                  - users
   *                                  - groups
   *                                properties:
   *                                  id:
   *                                    type: string
   *                                    minLength: 1
   *                                  users:
   *                                    type: number
   *                                  groups:
   *                                    type: number
   *                    required:
   *                      - id
   *                      - conditions
   */
  @Post('/enrollment/date')
  public async enrollmentByDate(
    @Body({ validate: { validationError: { target: false, value: false } } })
    auditParams: EnrollmentAnalyticsDateValidator
  ): Promise<any> {
    return this.auditService.getEnrollmentStatsByDate(auditParams.experimentId, auditParams.dateEnum, auditParams.clientOffset);
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
    this.log.info('Request received for csv download', JSON.stringify(csvInfo, null, 2));
    return this.auditService.getCSVData(csvInfo.experimentId, csvInfo.email);
  }
}
