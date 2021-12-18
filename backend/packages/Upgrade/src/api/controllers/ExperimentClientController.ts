import { JsonController, Post, Body, UseBefore, Get, BodyParam, Req, InternalServerError, Delete } from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { MarkExperimentValidator } from './validators/MarkExperimentValidator';
import { ExperimentAssignmentValidator } from './validators/ExperimentAssignmentValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { UpdateWorkingGroupValidator } from './validators/UpdateWorkingGroupValidator';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { IExperimentAssignment, ISingleMetric, IGroupMetric, SERVER_ERROR } from 'upgrade_types';
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
   *               group:
   *                 type: object
   *               workingGroup:
   *                 type: object
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    @Req()
    request: AppRequest,
    experimentUser: ExperimentUser
  ): Promise<Pick<ExperimentUser, 'id' | 'group' | 'workingGroup'>> {
    request.logger.info({ message: 'Starting the init call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(experimentUser.id, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc : experimentUserDoc })
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
   *               group:
   *                 type: object
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    @Req()
    request: AppRequest,
    experimentUser: ExperimentUser
  ): Promise<ExperimentUser> {
    request.logger.info({ message: 'Starting the groupmembership call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(experimentUser.id, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc : experimentUserDoc })
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
   *               workingGroup:
   *                 type: object
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    @Req()
    request: AppRequest,
    workingGroupParams: UpdateWorkingGroupValidator
  ): Promise<ExperimentUser> {
    request.logger.info({ message: 'Starting the workinggroup call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(workingGroupParams.id, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc : experimentUserDoc })
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
   *             properties:
   *               userId:
   *                 type: string
   *               experimentPoint:
   *                 type: string
   *               partitionId:
   *                 type: string
   *               condition:
   *                 type: string
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    @Req()
    request: AppRequest,
    experiment: MarkExperimentValidator
  ): Promise<MonitoredExperimentPoint> {
    request.logger.info({ message: 'Starting the markExperimentPoint call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(experiment.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc : experimentUserDoc })
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentAssignmentService.markExperimentPoint(
      experiment.userId,
      experiment.experimentPoint,
      experiment.condition,
      {
        logger: request.logger,
        userDoc: experimentUserDoc,
      },
      experiment.partitionId
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
   *               context:
   *                 type: string
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
   */
  @Post('assign')
  public async getAllExperimentConditions(
    @Body({ validate: { validationError: { target: false, value: false } } })
    @Req()
    request: AppRequest,
    experiment: ExperimentAssignmentValidator
  ): Promise<IExperimentAssignment[]> {
    request.logger.info({ message: 'Starting the getAllExperimentConditions call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(experiment.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentAssignmentService.getAllExperimentConditions(experiment.userId, experiment.context, {
      logger: request.logger,
      userDoc: experimentUserDoc,
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    @Req()
    request: AppRequest,
    logData: LogValidator
  ): Promise<Log[]> {
    request.logger.info({ message: 'Starting the log call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = await this.getUserDoc(logData.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc : experimentUserDoc })
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentAssignmentService.dataLog(logData.userId, logData.value, {
      logger: request.logger,
      userDoc: experimentUserDoc,
    });
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
      request.on('readable', async (data) => {
        const blobData = JSON.parse(request.read());
        try {
          // The function will throw error if userId doesn't exist
          const experimentUserDoc = await this.getUserDoc(blobData.userId, request.logger);
          if (experimentUserDoc) {
            // append userDoc in logger
            request.logger.child({ userDoc : experimentUserDoc })
            request.logger.info({ message: 'Got the original user doc' });
          }
          const response = await this.experimentAssignmentService.blobDataLog(blobData.userId, blobData.value, request.logger);
          resolve(response);
        } catch (error) {
          // The error is rejected so promise can now handle this error
          reject(error);
        }
      });
    }).catch((error) => {
      throw new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: error.message,
        })
      );
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    @Req()
    request: AppRequest,
    errorBody: FailedParamsValidator
  ): Promise<ExperimentError> {
    const experimentUserDoc = await this.getUserDoc(errorBody.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc : experimentUserDoc })
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
  public getAllFlags( @Req() request: AppRequest): Promise<FeatureFlag[]> {
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
  public filterMetrics(@BodyParam('metricUnit') metricUnit: Array<ISingleMetric | IGroupMetric>, 
  @Req()
  request: AppRequest): Promise<Metric[]> {
    return this.metricService.saveAllMetrics(metricUnit, request.logger);
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
   *              aliases:
   *                type: array
   *                items:
   *                 type: string
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
    @Body()
    @Req()
    request: AppRequest,
    user: ExperimentUserAliasesValidator): Promise<ExperimentUser[]> {
    const experimentUserDoc = await this.getUserDoc(user.userId, request.logger);
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc : experimentUserDoc })
      request.logger.info({ message: 'Got the original user doc' });
    }
    return this.experimentUserService.setAliasesForUser(user.userId, user.aliases, {
      logger: request.logger,
      userDoc: experimentUserDoc,
    });
  }

  public async getUserDoc(experimentUserId, logger) {
    const experimentUserDoc = await this.experimentUserService.getOriginalUserDoc(experimentUserId, logger);
    if ( experimentUserDoc ) {
      var aliasUserId = experimentUserId;
        if (!experimentUserDoc.aliases) {
          aliasUserId = experimentUserId;
        }
        const userDoc = {
          user: {
            id: aliasUserId,
            originalUserId: experimentUserDoc.id,
            group: experimentUserDoc.group,
            workingGroup: experimentUserDoc.workingGroup
          }
        };
        return userDoc;
    } else {
      return null; 
    }
  }

  @Delete('clearDB')
  public clearDB(): Promise<string> {
    // if DEMO mode is enabled, then clear the database:
    if(env.app.demo) {
      return this.experimentUserService.clearDB();
    }
    return Promise.resolve('DEMO mode is disabled. You cannot clear DB.');
  }
}
