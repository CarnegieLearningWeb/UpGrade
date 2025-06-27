import {
  JsonController,
  Post,
  Body,
  UseBefore,
  Req,
  InternalServerError,
  Delete,
  Patch,
  Authorized,
} from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { ExperimentAssignmentValidatorv6 } from './validators/ExperimentAssignmentValidator';
import { FeatureFlagRequestValidator } from './validators/FeatureFlagRequestValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { UpdateWorkingGroupValidatorv6 } from './validators/UpdateWorkingGroupValidator';
import {
  IExperimentAssignmentv5,
  IGroupMembership,
  IUserAliases,
  IWorkingGroup,
  PAYLOAD_TYPE,
  IPayload,
} from 'upgrade_types';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { ClientLibMiddleware } from '../middlewares/ClientLibMiddleware';
import { LogValidatorv6 } from './validators/LogValidator';
import { MetricService } from '../services/MetricService';
import { ExperimentUserAliasesValidatorv6 } from './validators/ExperimentUserAliasesValidator';
import { AppRequest } from '../../types';
import { MonitoredDecisionPointLog } from '../models/MonitoredDecisionPointLog';
import { MarkExperimentValidatorv6 } from './validators/MarkExperimentValidator.v6';
import { Log } from '../models/Log';
import { ExperimentUserValidatorv6 } from './validators/ExperimentUserValidator';
import { UserCheckMiddleware } from '../middlewares/UserCheckMiddleware';

interface IMonitoredDecisionPoint {
  id: string;
  user: ExperimentUser;
  site: string;
  target: string;
  experimentId: string;
  condition: string;
  monitoredPointLogs: MonitoredDecisionPointLog[];
}

/**
 * @swagger
 * definitions:
 *   v6initResponse:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         minLength: 1
 *       group:
 *         type: object
 *         properties:
 *           class:
 *             type: array
 *             items:
 *               type: string
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

@JsonController('/v6/')
@UseBefore(ClientLibMiddleware)
@UseBefore(UserCheckMiddleware)
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
   * /v6/init:
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
   *              $ref: '#/definitions/v6initResponse'
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Post('init')
  public async init(
    @Req()
    request: AppRequest,
    @Body({ validate: { whitelist: true, forbidNonWhitelisted: true } })
    experimentUser: ExperimentUserValidatorv6
  ): Promise<Pick<ExperimentUser, 'id' | 'group' | 'workingGroup'>> {
    request.logger.info({ message: 'Starting the init call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = request.userDoc;
    // if reinit call is made with any of the below fields not included in the call,
    // then we will fetch the stored values of the field and return them in the response
    // for consistent init response with 3 fields ['userId', 'group', 'workingGroup']
    const { id = request.get('User-Id'), group, workingGroup } = { ...experimentUserDoc, ...experimentUser };
    if (experimentUserDoc) {
      // append userDoc in logger
      request.logger.child({ userDoc: experimentUserDoc });
      request.logger.info({ message: 'Got the original user doc' });
    }

    const upsertResult = await this.experimentUserService.upsertOnChange(
      experimentUserDoc,
      { id, ...experimentUser },
      request.logger
    );

    if (!upsertResult) {
      request.logger.error({
        details: 'user upsert failed',
      });
      throw new InternalServerError('user init failed');
    }

    return { id, group, workingGroup };
  }

  /**
   * @swagger
   * /v6/groupmembership:
   *    patch:
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
   *              $ref: '#/definitions/v6initResponse'
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Patch('groupmembership')
  public async setGroupMemberShip(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    experimentUser: ExperimentUserValidatorv6
  ): Promise<IGroupMembership> {
    request.logger.info({ message: 'Starting the groupmembership call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = request.userDoc;
    const { id, group } = await this.experimentUserService.updateGroupMembership(
      experimentUserDoc.requestedUserId,
      experimentUser.group,
      {
        logger: request.logger,
        userDoc: experimentUserDoc,
      }
    );
    return { id, group };
  }

  /**
   * @swagger
   * /v6/workinggroup:
   *    patch:
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
   *              $ref: '#/definitions/v6initResponse'
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Patch('workinggroup')
  public async setWorkingGroup(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    workingGroupParams: UpdateWorkingGroupValidatorv6
  ): Promise<IWorkingGroup> {
    request.logger.info({ message: 'Starting the workinggroup call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = request.userDoc;
    const { id, workingGroup } = await this.experimentUserService.updateWorkingGroup(
      experimentUserDoc.requestedUserId,
      workingGroupParams.workingGroup,
      {
        logger: request.logger,
        userDoc: experimentUserDoc,
      }
    );
    return { id, workingGroup };
  }

  /**
   * @swagger
   * /v6/mark:
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
   *                - data
   *             properties:
   *               data:
   *                type: object
   *                properties:
   *                  site:
   *                    type: string
   *                  target:
   *                    type: string
   *                    example: partition1
   *                  assignedCondition:
   *                    type: object
   *                    properties:
   *                      conditionCode:
   *                        type: string
   *                        example: control
   *                  experimentId:
   *                    type: string
   *                    example: exp1
   *               status:
   *                 type: string
   *                 example: condition applied
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
   *                id:
   *                  type: string
   *                  minLength: 1
   *                userId:
   *                  type: string
   *                  minLength: 1
   *                experimentId:
   *                  type: string
   *                  minLength: 1
   *                site:
   *                  type: string
   *                  minLength: 1
   *                target:
   *                  type: string
   *                  minLength: 1
   *                condition:
   *                  type: string
   *                  minLength: 1
   *              required:
   *                - id
   *                - experimentId
   *                - enrollmentCode
   *                - userId
   *                - condition
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Post('mark')
  public async markExperimentPoint(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    experiment: MarkExperimentValidatorv6
  ): Promise<IMonitoredDecisionPoint> {
    request.logger.info({ message: 'Starting the markExperimentPoint call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = request.userDoc;
    const { createdAt, updatedAt, versionNumber, ...rest } = await this.experimentAssignmentService.markExperimentPoint(
      experimentUserDoc,
      experiment.data.site,
      experiment.status,
      experiment.data.assignedCondition?.conditionCode ?? null,
      request.logger,
      experiment.data.assignedCondition?.experimentId ?? null,
      experiment.data.target,
      experiment.uniquifier ? experiment.uniquifier : null,
      experiment.clientError ? experiment.clientError : null
    );
    return rest;
  }

  /**
   * @swagger
   * /v6/assign:
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
   *                  - site
   *                  - target
   *                  - condition
   *                properties:
   *                  site:
   *                    type: string
   *                    minLength: 1
   *                  target:
   *                    type: string
   *                    minLength: 1
   *                  experimentType:
   *                    type: string
   *                    enum: [Simple, Factorial]
   *                  assignedCondition:
   *                    type: array
   *                    items:
   *                      type: object
   *                      properties:
   *                         conditionCode:
   *                          type: string
   *                          minLength: 1
   *                         payload:
   *                          type: object
   *                          properties:
   *                            type:
   *                              type: string
   *                            value:
   *                              type: string
   *                         id:
   *                          type: string
   *                         experimentId:
   *                          type: string
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Post('assign')
  public async getAllExperimentConditions(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    experiment: ExperimentAssignmentValidatorv6
  ): Promise<IExperimentAssignmentv5[]> {
    request.logger.info({ message: 'Starting the getAllExperimentConditions call for user' });
    const experimentUserDoc = request.userDoc;
    const assignedData = await this.experimentAssignmentService.getAllExperimentConditions(
      experimentUserDoc,
      experiment.context,
      request.logger
    );

    return assignedData.map(({ assignedFactor, assignedCondition, ...rest }) => {
      const finalFactorData = assignedFactor?.map((factor) => {
        const updatedAssignedFactor: Record<string, { level: string; payload: IPayload }> = {};
        Object.keys(factor).forEach((key) => {
          updatedAssignedFactor[key] = {
            level: factor[key].level,
            payload:
              factor[key].payload && factor[key].payload.value
                ? { type: PAYLOAD_TYPE.STRING, value: factor[key].payload.value }
                : null,
          };
        });
        return updatedAssignedFactor;
      });

      const finalConditionData = assignedCondition.map((condition) => {
        return {
          id: condition.id,
          conditionCode: condition.conditionCode,
          payload:
            condition.payload && condition.payload.value
              ? { type: condition.payload.type, value: condition.payload.value }
              : null,
          experimentId: condition.experimentId,
        };
      });
      return {
        ...rest,
        assignedCondition: finalConditionData,
        assignedFactor: assignedFactor ? finalFactorData : undefined,
      };
    });
  }

  /**
   * @swagger
   * /v6/log:
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
   *               value:
   *                 type: array
   *                 required: true
   *                 items:
   *                   type: object
   *                   properties:
   *                      timestamp:
   *                        type: string
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
   *                                          required: true
   *                                          example: workspaceType
   *                                      groupKey:
   *                                          type: string
   *                                          required: true
   *                                          example: workspaceName
   *                                      groupUniquifier:
   *                                           type: string
   *                                           required: true
   *                                           example: workspaceUniquifier
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
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Post('log')
  public async log(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    logData: LogValidatorv6
  ): Promise<Omit<Log, 'createdAt' | 'updatedAt' | 'versionNumber'>[]> {
    request.logger.info({ message: 'Starting the log call for user' });
    // getOriginalUserDoc call for alias
    const experimentUserDoc = request.userDoc;
    const logs = await this.experimentAssignmentService.dataLog(experimentUserDoc, logData.value, request.logger);
    return logs.map(({ createdAt, updatedAt, versionNumber, ...rest }) => {
      return rest;
    });
  }

  /**
   * @swagger
   * /v6/featureflag:
   *    post:
   *       description: |
   *         Get feature flags that have been assigned to the user.
   *
   *         This endpoint supports three different modes of operation based on the optional parameters:
   *
   *         **Stored-user Mode** (Standard stored user lookup):
   *         - Omit both `groupsForSession` and `includeStoredUserGroups` parameters
   *         - Uses only stored user groups from the database
   *         - User must already have been initialized, will 404 if user does not exist
   *
   *         **Ephemeral Mode** (Session-only groups):
   *         - Set `includeStoredUserGroups` to `false` and provide `groupsForSession`
   *         - Uses only the groups provided in the session, ignoring any stored user groups.
   *         - Does not require the user to be initialized (it will bypass stored user lookup)
   *         - Useful when complete group information is always provided at runtime.
   *
   *         **Merged Mode** (Stored + Session groups):
   *         - Set `includeStoredUserGroups` to `true` and provide `groupsForSession`
   *         - User must already have been initialized, will 404 if user does not exist.
   *         - Session groups are merged with stored groups if they don't already exist for stored user.
   *         - Session groups are never persisted.
   *         - Useful for adding context-specific ephemeral groups to an existing user.
   *
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: header
   *           name: User-Id
   *           required: true
   *           schema:
   *             type: string
   *           example: user123
   *           description: The unique identifier for the user
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - context
   *             properties:
   *               context:
   *                 type: string
   *                 example: "test-context"
   *                 description: The context for feature flag evaluation
   *               groupsForSession:
   *                 type: object
   *                 additionalProperties:
   *                   type: array
   *                   items:
   *                     type: string
   *                 example:
   *                   schoolId: ["temporary-school-id"]
   *                 description: Optional groups to provide for the session (not persisted)
   *               includeStoredUserGroups:
   *                 type: boolean
   *                 description: Whether to include stored user groups in evaluation
   *                 example: false
   *             description: Feature flag request parameters
   *             examples:
   *               normal_mode:
   *                 summary: Normal Mode - Standard stored user lookup
   *                 description: Uses only stored user groups from the database
   *                 value:
   *                   context: "test-context"
   *               ephemeral_mode:
   *                 summary: Ephemeral Mode - Session-only groups
   *                 description: Uses only session groups, ignoring stored user groups
   *                 value:
   *                   context: "test-context"
   *                   groupsForSession:
   *                     schoolId: ["demo-school"]
   *                     classId: ["demo-class-advanced"]
   *                   includeStoredUserGroups: false
   *               merged_mode:
   *                 summary: Merged Mode - Stored + Session groups
   *                 description: Combines stored user groups (if exists) with session groups
   *                 value:
   *                   context: "test-context"
   *                   groupsForSession:
   *                     classId: ["temp-class-123", "special-session"]
   *                   includeStoredUserGroups: true
   *       produces:
   *         - application/json
   *       tags:
   *         - Client Side SDK
   *       responses:
   *          '200':
   *            description: Feature flags list
   *            schema:
   *              type: array
   *              items:
   *                type: string
   *              example: ["NEW_FEATURE", "TEST_FLAG"]
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Post('featureflag')
  public async getAllFlags(
    @Req() request: AppRequest,
    @Body({ validate: true })
    featureFlagRequest: FeatureFlagRequestValidator
  ): Promise<string[]> {
    const experimentUserDoc = request.userDoc;
    return this.featureFlagService.getKeys(experimentUserDoc, featureFlagRequest.context, request.logger);
  }

  /**
   * @swagger
   * /v6/useraliases:
   *    patch:
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
   *               - aliases
   *             properties:
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
   *              type: object
   *              properties:
   *                userId:
   *                  type: string
   *                  minLength: 1
   *                aliases:
   *                  type: array
   *                  items:
   *                    type: string
   *              required:
   *               - userId
   *               - userAliases
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   *          '500':
   *            description: Internal Server Error
   */
  @Patch('useraliases')
  public async setUserAliases(
    @Req()
    request: AppRequest,
    @Body({ validate: true })
    user: ExperimentUserAliasesValidatorv6
  ): Promise<IUserAliases> {
    const experimentUserDoc = request.userDoc;
    return this.experimentUserService.setAliasesForUser(experimentUserDoc, user.aliases, request.logger);
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
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: DEMO mode is disabled
   */
  @Authorized()
  @Delete('clearDB')
  public async clearDB(@Req() request: AppRequest): Promise<string> {
    return this.experimentUserService.clearDB(request.logger);
  }
}
