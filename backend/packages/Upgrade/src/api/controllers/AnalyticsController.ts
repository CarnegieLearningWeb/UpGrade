import { JsonController, Post, Body, Authorized, Req, Get, QueryParams } from 'routing-controllers';
import { AnalyticsService } from '../services/AnalyticsService';
import { IExperimentEnrollmentStats, IExperimentEnrollmentDetailStats } from 'upgrade_types';
import { EnrollmentAnalyticsValidator } from './validators/EnrollmentAnalyticsValidator';
import { EnrollmentAnalyticsDateValidator } from './validators/EnrollmentAnalyticsDateValidator';
import { EnrollmentDetailAnalyticsValidator } from './validators/EnrollmentDetailAnalyticsValidator';
import { DataExportValidator } from './validators/DataExportValidator';
import { AppRequest } from '../../types';

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
   *                example: exp01
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
   *                    example: 1049
   *                  groups:
   *                    type: number
   *                    example: 23
   *                  id:
   *                    type: string
   *                    minLength: 1
   *                    example: exp01
   *          '400':
   *            description: experimentIds should have valid UUIDs.
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Post('/enrollment')
  public async analyticsService(
    @Body({ validate: true }) auditParams: EnrollmentAnalyticsValidator
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
   *               example: exp01
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
   *                  example: exp01
   *                users:
   *                  type: number
   *                  example: 1240
   *                groups:
   *                  type: number
   *                  example: 13
   *                usersExcluded:
   *                  type: number
   *                  example: 245
   *                groupsExcluded:
   *                  type: number
   *                  example: 4
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
   *                        example: control
   *                      users:
   *                        type: number
   *                        example: 486
   *                      groups:
   *                        type: number
   *                        example: 7
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
   *                              example: "using_fractions"
   *                            users:
   *                              type: number
   *                              example: 158
   *                            groups:
   *                              type: number
   *                              example: 3
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Post('/enrollment/detail')
  public async analyticsDetailService(
    @Body({ validate: true })
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
   *               example: 45b9d8cd-f113-4f93-9826-c3d1ff4ee73c
   *              dateEnum:
   *               type: string
   *               enum: [last_seven_days, last_three_months, last_six_months, last_twelve_months]
   *              clientOffset:
   *               type: number
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
   *                              example: control
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
   *                                    example: using_fractions
   *                                  users:
   *                                    type: number
   *                                    example: 58
   *                                  groups:
   *                                    type: number
   *                                    example: 4
   *                    required:
   *                      - id
   *                      - conditions
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Post('/enrollment/date')
  public async enrollmentByDate(
    @Body({ validate: true })
    auditParams: EnrollmentAnalyticsDateValidator
  ): Promise<any> {
    return this.auditService.getEnrollmentStatsByDate(
      auditParams.experimentId,
      auditParams.dateEnum,
      auditParams.clientOffset
    );
  }

  /**
   * @swagger
   * /stats/csv:
   *    get:
   *       description: Export CSV data file to the given mail id
   *       parameters:
   *         - in: query
   *           name: experimentId
   *           required: true
   *           schema:
   *             type: string
   *             example: 1bc1a783-0290-4058-88de-21211cbd242e
   *         - in: query
   *           name: email
   *           required: true
   *           schema:
   *             type: string
   *       tags:
   *         - Analytics
   *       responses:
   *          '200':
   *            description: Export CSV data file to the given mail id
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: experimentId NotFoundError
   *          '500':
   *            description: Internal Server Error
   */
  @Get('/csv')
  public async downloadCSV(
    @QueryParams()
    params: DataExportValidator,
    @Req()
    request: AppRequest
  ): Promise<string> {
    request.logger.info({ message: `Request received for csv download ${JSON.stringify(params, null, 2)}` });
    return this.auditService.getCSVData(params.experimentId, params.email, request.logger);
  }
}
