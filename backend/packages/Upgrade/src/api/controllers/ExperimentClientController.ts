import {
  JsonController,
  Post,
  Body,
  UseBefore,
  Get,
  Req,
  InternalServerError,
  Delete,
} from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { MarkExperimentValidator } from './validators/MarkExperimentValidator';
import { ExperimentAssignmentValidator } from './validators/ExperimentAssignmentValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { UpdateWorkingGroupValidator } from './validators/UpdateWorkingGroupValidator';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import { SERVER_ERROR, PAYLOAD_TYPE } from 'upgrade_types';
import { FailedParamsValidator } from './validators/FailedParamsValidator';
import { ExperimentError } from '../models/ExperimentError';
import { FeatureFlag } from '../models/FeatureFlag';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { ClientLibMiddleware } from '../middlewares/ClientLibMiddleware';
import { LogValidator } from './validators/LogValidator';
import { Log } from '../models/Log';
import { MetricService } from '../services/MetricService';
import { ExperimentUserAliasesValidator } from './validators/ExperimentUserAliasesValidator';
import { Metric } from '../models/Metric';
import * as express from 'express';
import { AppRequest } from '../../types';
import { env } from '../../env';
import flatten from 'lodash.flatten';
import { CaliperLogEnvelope } from './validators/CaliperLogEnvelope';
import { ExperimentUserValidator } from './validators/ExperimentUserValidator';
import { MetricValidator } from './validators/MetricValidator';

interface IExperimentAssignment {
  expId: string;
  expPoint: string;
  assignedCondition: {
    conditionCode: string;
    payload: { type: PAYLOAD_TYPE; value: string };
    experimentId?: string;
    id: string;
  };
}

/**
 * @swagger
 * definitions:
 *   initResponse:
 *     type: object
 *     properties:
 *       createdAt:
 *         type: string
 *         minLength: 1
 *       updatedAt:
 *         type: string
 *         minLength: 1
 *       versionNumber:
 *         type: number
 *       id:
 *         type: string
 *         minLength: 1
 *       group:
 *         type: object
 *         properties:
 *           class:
 *             type: array
 *             items:
 *               required: []
 *               properties: {}
 *         required:
 *           - class
 *       workingGroup:
 *         type: object
 *         properties:
 *           school:
 *             type: string
 *             minLength: 1
 *           class:
 *             type: string
 *             minLength: 1
 *           instructor:
 *             type: string
 *             minLength: 1
 *         required:
 *           - school
 *           - class
 *           - instructor
 *     required:
 *       - createdAt
 *       - updatedAt
 *       - versionNumber
 *       - id
 *       - group
 *       - workingGroup
 */

/**
 * @swagger
 * tags:
 *   - name: Client Side SDK
 *     description: CRUD operations related to experiments points
 */

@JsonController('/')
@UseBefore(ClientLibMiddleware)
export class ExperimentClientController {
  constructor(
    public experimentService: ExperimentService,
    public experimentAssignmentService: ExperimentAssignmentService,
    public experimentUserService: ExperimentUserService,
    public featureFlagService: FeatureFlagService,
    public metricService: MetricService
  ) {}

  /**
   * @swagger
   * /init:
   *    post:
   *       description: Create/Update Experiment User
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experimentUser
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *                 example: user1
   *               group:
   *                 type: object
   *                 properties:
   *                   schoolId:
   *                      type: array
   *                      items:
   *                        type: string
   *                        example: school1
   *                   classId:
   *                      type: array
   *                      items:
   *                        type: string
   *                        example: class1
   *                   instructorId:
   *                      type: array
   *                      items:
   *                        type: string
   *                        example: instructor1
   *               workingGroup:
   *                 type: object
   *                 properties:
   *                   schoolId:
   *                      type: string
   *                      example: school1
   *                   classId:
   *                      type: string
   *                      example: class1
   *                   instructorId:
   *                      type: string
   *                      example: instructor1
   *           description: ExperimentUser
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Set Group Membership
   *            schema:
   *              $ref: '#/definitions/initResponse'
   */
  @Post('init')
  public async init(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    experimentUser: ExperimentUserValidator
  ): Promise<Pick<ExperimentUser, 'id' | 'group' | 'workingGroup'>> {
    request.logger.info({ message: 'Starting the init call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(experimentUser.id, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    const userDocument = await this.experimentUserService.create([experimentUser], request.logger);
    if (!userDocument || !userDocument[0]) {
      request.logger.error({
        details: 'user document not present',
      });
      throw new InternalServerError('user document not present');
    }
    // if reinit call is made with any of the below fields not included in the call,
    // then we will fetch the stored values of the field and return them in the response
    // for consistent init response with 3 fields ['userId', 'group', 'workingGroup']
    const { id, group, workingGroup } = userDocument[0];
    return { id, group, workingGroup };
  }

  /**
   * @swagger
   * /groupmembership:
   *    post:
   *       description: Set group membership for a user
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experimentUser
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *                 example: user1
   *               group:
   *                 type: object
   *                 properties:
   *                   schoolId:
   *                      type: array
   *                      items:
   *                        type: string
   *                        example: school1
   *                   classId:
   *                      type: array
   *                      items:
   *                        type: string
   *                        example: class1
   *                   instructorId:
   *                      type: array
   *                      items:
   *                        type: string
   *                        example: instructor1
   *           description: ExperimentUser
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Set Group Membership
   *            schema:
   *              $ref: '#/definitions/initResponse'
   *          '500':
   *            description: null value in column "id" of relation "experiment_user" violates not-null constraint
   */
  @Post('groupmembership')
  public async setGroupMemberShip(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    experimentUser: ExperimentUserValidator
  ): Promise<ExperimentUser> {
    request.logger.info({ message: 'Starting the groupmembership call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(experimentUser.id, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentUserService.updateGroupMembership(experimentUser.id, experimentUser.group, {
      logger: request.logger,
      userDoc: experimentUserDoc,
    });
  }

  /**
   * @swagger
   * /workinggroup:
   *    post:
   *       description: Set working group for a user
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *                 example: user1
   *               workingGroup:
   *                 type: object
   *                 properties:
   *                   schoolId:
   *                      type: string
   *                      example: school1
   *                   classId:
   *                      type: string
   *                      example: class1
   *                   instructorId:
   *                      type: string
   *                      example: instructor1
   *           description: ExperimentUser
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Set Group Membership
   *            schema:
   *              $ref: '#/definitions/initResponse'
   *          '500':
   *            description: null value in column "id" of relation "experiment_user" violates not-null constraint
   */
  @Post('workinggroup')
  public async setWorkingGroup(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    workingGroupParams: UpdateWorkingGroupValidator
  ): Promise<ExperimentUser> {
    request.logger.info({ message: 'Starting the workinggroup call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(workingGroupParams.id, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentUserService.updateWorkingGroup(workingGroupParams.id, workingGroupParams.workingGroup, {
      logger: request.logger,
      userDoc: experimentUserDoc,
    });
  }

  /**
   * @swagger
   * /mark:
   *    post:
   *       description: Mark a Experiment Point
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experimentUser
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *                - userId
   *                - experimentPoint
   *                - condition
   *             properties:
   *               userId:
   *                 type: string
   *                 example: user1
   *               experimentPoint:
   *                 type: string
   *                 example: point1
   *               partitionId:
   *                 type: string
   *                 example: partition1
   *               condition:
   *                 type: string
   *                 example: control
   *               status:
   *                 type: string
   *                 example: condition applied
   *               experimentId:
   *                 type: string
   *                 example: exp1
   *           description: ExperimentUser
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment Point is Marked
   *            schema:
   *              type: object
   *              properties:
   *                createdAt:
   *                  type: string
   *                  minLength: 1
   *                updatedAt:
   *                  type: string
   *                  minLength: 1
   *                versionNumber:
   *                  type: number
   *                id:
   *                  type: string
   *                  minLength: 1
   *                experimentId:
   *                  type: string
   *                  minLength: 1
   *                enrollmentCode:
   *                  type: string
   *                  minLength: 1
   *                userId:
   *                  type: string
   *                  minLength: 1
   *                condition:
   *                  type: string
   *                  minLength: 1
   *              required:
   *                - createdAt
   *                - updatedAt
   *                - versionNumber
   *                - id
   *                - experimentId
   *                - enrollmentCode
   *                - userId
   *                - condition
   *          '500':
   *            description: User not defined
   */
  @Post('mark')
  public async markExperimentPoint(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    experiment: MarkExperimentValidator
  ): Promise<MonitoredDecisionPoint> {
    request.logger.info({ message: 'Starting the markExperimentPoint call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(experiment.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentAssignmentService.markExperimentPoint(
      experiment.userId,
      experiment.experimentPoint,
      experiment.status,
      experiment.condition,
      {
        logger: request.logger,
        userDoc: experimentUserDoc,
      },
      experiment.partitionId,
      experiment.experimentId ? experiment.experimentId : null
    );
  }

  /**
   * @swagger
   * /assign:
   *    post:
   *       description: Assign a Experiment Point
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: user
   *            required: true
   *            schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 example: user1
   *               context:
   *                 type: string
   *                 example: add
   *            description: User Document
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment Point is Assigned
   *            schema:
   *              type: array
   *              description: ''
   *              minItems: 1
   *              uniqueItems: true
   *              items:
   *                type: object
   *                required:
   *                  - expId
   *                  - expPoint
   *                  - twoCharacterId
   *                  - assignedCondition
   *                properties:
   *                  expId:
   *                    type: string
   *                    minLength: 1
   *                  expPoint:
   *                    type: string
   *                    minLength: 1
   *                  twoCharacterId:
   *                    type: string
   *                    minLength: 1
   *                  assignedCondition:
   *                    type: object
   *                    properties:
   *                      createdAt:
   *                        type: string
   *                        minLength: 1
   *                      updatedAt:
   *                        type: string
   *                        minLength: 1
   *                      versionNumber:
   *                        type: number
   *                      id:
   *                        type: string
   *                        minLength: 1
   *                      twoCharacterId:
   *                        type: string
   *                        minLength: 1
   *                      name:
   *                        type: string
   *                      description: {}
   *                      conditionCode:
   *                        type: string
   *                        minLength: 1
   *                      assignmentWeight:
   *                        type: number
   *                      order:
   *                        type: number
   *                    required:
   *                      - createdAt
   *                      - updatedAt
   *                      - versionNumber
   *                      - id
   *                      - twoCharacterId
   *                      - name
   *                      - conditionCode
   *                      - assignmentWeight
   *                      - order
   *          '500':
   *            description: null value in column "id" of relation "experiment_user" violates not-null constraint
   *          '404':
   *            description: Experiment user not defined
   */
  @Post('assign')
  public async getAllExperimentConditions(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    experiment: ExperimentAssignmentValidator
  ): Promise<IExperimentAssignment[]> {
    request.logger.info({ message: 'Starting the getAllExperimentConditions call for user' });
    const assignedData = await this.experimentAssignmentService.getAllExperimentConditions(
      experiment.userId,
      experiment.context,
      {
        logger: request.logger,
        userDoc: null,
      }
    );

    return assignedData.map(({ site, target, assignedCondition }) => {
      const conditionCode = assignedCondition[0].payload?.value || assignedCondition[0].conditionCode;
      return {
        expPoint: site,
        expId: target,
        assignedCondition: { ...assignedCondition[0], conditionCode: conditionCode },
      };
    });
  }

  /**
   * @swagger
   * /log:
   *    post:
   *       description: Post log data
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: data
   *            required: true
   *            schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               value:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                      userId:
   *                         type: string
   *                         example: user1
   *                      metrics:
   *                         type: object
   *                         properties:
   *                            attributes:
   *                              type: object
   *                              properties:
   *                                  continuousMetricName:
   *                                    type: integer
   *                                    example: 100
   *                                  categoricalMetricName:
   *                                    type: string
   *                                    example: CATEGORY
   *                            groupedMetrics:
   *                              type: array
   *                              items:
   *                                  type: object
   *                                  properties:
   *                                      groupClass:
   *                                          type: string
   *                                          example: workspaceType
   *                                      groupKey:
   *                                           type: string
   *                                           example: workspaceName
   *                                      attributes:
   *                                        type: object
   *                                        properties:
   *                                            continuousMetricName:
   *                                              type: integer
   *                                              example: 100
   *                                            categoricalMetricName:
   *                                              type: string
   *                                              example: CATEGORY
   *            description: User Document
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Log data
   *          '500':
   *            description: null value in column "id\" of relation \"experiment_user\" violates not-null constraint
   */
  @Post('log')
  public async log(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    logData: LogValidator
  ): Promise<Log[]> {
    request.logger.info({ message: 'Starting the log call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(logData.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentAssignmentService.dataLog(logData.userId, logData.value, {
      logger: request.logger,
      userDoc: experimentUserDoc,
    });
  }

  /**
   * @swagger
   * /log/caliper:
   *    post:
   *       description: Post Caliper format log data
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: data
   *            required: true
   *            description: User Document
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Log data
   *          '500':
   *            description: null value in column "id\" of relation \"experiment_user\" violates not-null constraint
   */
  @Post('log/caliper')
  public async caliperLog(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    envelope: CaliperLogEnvelope
  ): Promise<Log[]> {
    const result = envelope.data.map(async (log) => {
      // getOriginalUserDoc call for alias
      const experimentUserDoc = await this.getUserDoc(log.object.assignee.id, request.logger);
      if (experimentUserDoc) {
        // append userDoc in logger
        request.logger.child({ userDoc: experimentUserDoc });
        request.logger.info({ message: 'Got the original user doc' });
      }
      return this.experimentAssignmentService.caliperDataLog(log, {
        logger: request.logger,
        userDoc: experimentUserDoc,
      });
    });

    const logsToReturn = await Promise.all(result);
    return flatten(logsToReturn);
  }

  /**
   * @swagger
   * /bloblog:
   *    post:
   *       description: Post blob log data
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: data
   *            required: true
   *            schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               value:
   *                 type: array
   *                 items:
   *                   type: object
   *            description: User Document
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Log blob data
   */
  @Post('bloblog')
  public async blobLog(@Req() request: express.Request): Promise<any> {
    return new Promise((resolve, reject) => {
      request.on('readable', async () => {
        const blobData = JSON.parse(request.read());
        try {
          // The function will throw error if userId doesn't exist
          const experimentUserDoc = await this.getUserDoc(blobData.userId, request.logger);
          if (experimentUserDoc) {
            // append userDoc in logger
            request.logger.child({ userDoc: experimentUserDoc });
            request.logger.info({ message: 'Got the original user doc' });
          }
          const response = await this.experimentAssignmentService.blobDataLog(
            blobData.userId,
            blobData.value,
            request.logger
          );
          resolve(response);
        } catch (error) {
          // The error is rejected so promise can now handle this error
          reject(error);
        }
      });
    }).catch((error) => {
      request.logger.error(error);
      error = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: error.message,
        })
      );
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404;
      throw error;
    });
  }

  /**
   * @swagger
   * /failed:
   *    post:
   *       description: Add error from client end
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: experimentError
   *            required: false
   *            schema:
   *             type: object
   *             properties:
   *              reason:
   *                type: string
   *              experimentPoint:
   *                type: string
   *              userId:
   *                type: string
   *              experimentId:
   *                type: string
   *            description: Experiment Error from client
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Client side reported error
   *          '500':
   *            description: null value in column "id\" of relation \"experiment_user\" violates not-null constraint
   */
  @Post('failed')
  public async failedExperimentPoint(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    errorBody: FailedParamsValidator
  ): Promise<ExperimentError> {
    const experimentUserDoc = await this.getUserDoc(errorBody.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentAssignmentService.clientFailedExperimentPoint(
      errorBody.reason,
      errorBody.experimentPoint,
      errorBody.userId,
      errorBody.experimentId,
      {
        logger: request.logger,
        userDoc: experimentUserDoc,
      }
    );
  }

  /**
   * @swagger
   * /featureflag:
   *    get:
   *       description: Get all feature flags using SDK
   *       produces:
   *         - application/json
   *       tags:
   *         - Client Side SDK
   *       responses:
   *          '200':
   *            description: Feature flags list
   */
  @Get('featureflag')
  public getAllFlags(@Req() request: AppRequest): Promise<FeatureFlag[]> {
    return this.featureFlagService.find(request.logger);
  }

  /**
   * @swagger
   * /metric:
   *    post:
   *       description: Add filter metrics
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: params
   *            schema:
   *             type: object
   *             properties:
   *              metricUnit:
   *                type: object
   *            description: Filtered Metrics
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Filtered Metrics
   *          '500':
   *            description: Insert error in database
   */
  @Post('metric')
  public async filterMetrics(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    metric: MetricValidator
  ): Promise<Metric[]> {
    return await this.metricService.saveAllMetrics(metric.metricUnit, request.logger);
  }

  /**
   * @swagger
   * /useraliases:
   *    post:
   *       description: Set aliases for current user
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: user aliases
   *            required: true
   *            schema:
   *             type: object
   *             required:
   *               - userId
   *               - aliases
   *             properties:
   *              userId:
   *                type: string
   *                example: user1
   *              aliases:
   *                type: array
   *                items:
   *                 type: string
   *                 example: alias123
   *            description: Set user aliases
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment User aliases added
   *            schema:
   *              type: array
   *              description: ''
   *              minItems: 1
   *              uniqueItems: true
   *              items:
   *                type: object
   *                required:
   *                  - id
   *                  - createdAt
   *                  - updatedAt
   *                  - versionNumber
   *                  - originalUser
   *                properties:
   *                  id:
   *                    type: string
   *                    minLength: 1
   *                  group: {}
   *                  workingGroup: {}
   *                  createdAt:
   *                    type: string
   *                    minLength: 1
   *                  updatedAt:
   *                    type: string
   *                    minLength: 1
   *                  versionNumber:
   *                    type: number
   *                  originalUser:
   *                    type: string
   *                    minLength: 1
   *          '500':
   *            description: null value in column "id\" of relation \"experiment_user\" violates not-null constraint
   */
  @Post('useraliases')
  public async setUserAliases(
    @Req()
    request: AppRequest,
    @Body()
    user: ExperimentUserAliasesValidator
  ): Promise<ExperimentUser[]> {
    const experimentUserDoc = await this.getUserDoc(user.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    const aliasData = await this.experimentUserService.setAliasesForUser(user.userId, user.aliases, {
      logger: request.logger,
      userDoc: experimentUserDoc,
    });

    return [
      {
        ...experimentUserDoc,
        aliases: aliasData.aliases.map((alias) => {
          return {
            id: alias,
          };
        }),
      } as any,
    ];
  }

  public async getUserDoc(experimentUserId, logger) {
    try {
      const experimentUserDoc = await this.experimentUserService.getOriginalUserDoc(experimentUserId, logger);
      if (experimentUserDoc) {
        const userDoc = {
          createdAt: experimentUserDoc.createdAt,
          id: experimentUserDoc.id,
          requestedUserId: experimentUserId,
          group: experimentUserDoc.group,
          workingGroup: experimentUserDoc.workingGroup,
        };
        logger.info({ message: 'Got the user doc', details: userDoc });
        return userDoc;
      } else {
        return null;
      }
    } catch (error) {
      logger.error({ message: `Error in getting user doc for user => ${experimentUserId}`, error });
      return null;
    }
  }

  /**
   * @swagger
   * /clearDB:
   *    delete:
   *       description: Only available in DEMO mode. Removes everything except UpGrade users, metric metadata, UpGrade settings, and migrations
   *       tags:
   *         - Client Side SDK
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Database cleared
   *          '500':
   *            description: DEMO mode is disabled
   */
  @Delete('clearDB')
  public async clearDB(@Req() request: AppRequest): Promise<string> {
    // if DEMO mode is enabled, then clear the database:
    if (env.app.demo) {
      await this.experimentUserService.clearDB(request.logger);
      return 'DB truncate successful';
    }
    return Promise.resolve('DEMO mode is disabled. You cannot clear DB.');
  }
}
