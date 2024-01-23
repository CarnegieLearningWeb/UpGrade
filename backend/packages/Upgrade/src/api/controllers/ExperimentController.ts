import {
  Body,
  Get,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put,
  Delete,
  Authorized,
  CurrentUser,
  Req,
} from 'routing-controllers';
import { Experiment } from '../models/Experiment';
import { ExperimentNotFoundError } from '../errors/ExperimentNotFoundError';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { SERVER_ERROR } from 'upgrade_types';
import { validate, isUUID } from 'class-validator';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentPaginatedParamsValidator } from './validators/ExperimentPaginatedParamsValidator';
import { User } from '../models/User';
import { DecisionPoint } from '../models/DecisionPoint';
import { AssignmentStateUpdateValidator } from './validators/AssignmentStateUpdateValidator';
import { env } from '../../env';
import { AppRequest, PaginationResponse } from '../../types';
import { ExperimentDTO } from '../DTO/ExperimentDTO';

interface ExperimentPaginationInfo extends PaginationResponse {
  nodes: ExperimentDTO[];
}

/**
 * @swagger
 * definitions:
 *   Experiment:
 *     required:
 *       - id
 *       - name
 *       - context
 *       - state
 *       - consistencyRule
 *       - assignmentUnit
 *       - postExperimentRule
 *       - enrollmentCompleteCondition
 *       - group
 *       - conditions
 *       - partitions
 *       - factors
 *       - conditionPayload
 *       - type
 *     properties:
 *       id:
 *         type: string
 *         example: exp01
 *       name:
 *         type: string
 *         example: TextExp1
 *       description:
 *         type: string
 *         example: a simple test experiment
 *       context:
 *         type: array
 *         items:
 *           type: string
 *       state:
 *         type: string
 *         enum: [inactive, demo, scheduled, enrolling, enrollmentComplete, cancelled]
 *       startOn:
 *          type: string
 *          format: date-time
 *       consistencyRule:
 *         type: string
 *         enum: [individual, experiment, group]
 *       assignmentUnit:
 *         type: string
 *         enum: [individual, group]
 *       postExperimentRule:
 *         type: string
 *         enum: [continue, revert, assign]
 *       enrollmentCompleteCondition:
 *          type: object
 *          properties:
 *           userCount:
 *             type: integer
 *           groupCount:
 *             type: integer
 *       endOn:
 *          type: string
 *          format: date-time
 *       revertTo:
 *          type: string
 *       tags:
 *          type: array
 *          items:
 *            type: string
 *       group:
 *         type: string
 *       filterMode:
 *         type: string
 *         enum: [includeAll, excludeAll]
 *       conditions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                type: string
 *                example: control
 *               assignmentWeight:
 *                type: number
 *                example: 50
 *               description:
 *                type: string
 *                example: Control Condition
 *               conditionCode:
 *                type: string
 *                example: control
 *       partitions:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             site:
 *               type: string
 *               example: SelectSection
 *             target:
 *               type: string
 *               example: using_fractions
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             excludeIfReached:
 *                type: boolean
 *       factors:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             levels:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 payload:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [string, json, csv]
 *                     value:
 *                       type:string
 *       queries:
 *         type: array
 *         items:
 *           type: object
 *       experimentSegmentInclusion:
 *          type: object
 *          properties:
 *              segment:
 *                type: object
 *                properties:
 *                  individualForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        userId:
 *                          type: string
 *                          example: user1
 *                  groupForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        groupId:
 *                          type: string
 *                          example: school1
 *                        type:
 *                           type: string
 *                           example: schoolId
 *                  subSegments:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        id:
 *                          type: string
 *                        name:
 *                          type: string
 *                        context:
 *                          type: string
 *       experimentSegmentExclusion:
 *          type: object
 *          properties:
 *              segment:
 *                type: object
 *                properties:
 *                  individualForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        userId:
 *                          type: string
 *                          example: user1
 *                  groupForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        groupId:
 *                          type: string
 *                          example: school1
 *                        type:
 *                           type: string
 *                           example: schoolId
 *                  subSegments:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        id:
 *                          type: string
 *                        name:
 *                          type: string
 *                        context:
 *                          type: string
 *       type:
 *         type: string
 *       conditionPayloads:
 *         type: array
 *         items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               payload:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [string, json, csv]
 *                   value:
 *                     type:string
 *   ExperimentResponse:
 *     description: ''
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
 *       name:
 *         type: string
 *         minLength: 1
 *       description:
 *         type: string
 *         minLength: 1
 *       context:
 *         type: array
 *         items:
 *           required: []
 *           properties: {}
 *       state:
 *         type: string
 *         minLength: 1
 *       startOn: {}
 *       consistencyRule:
 *         type: string
 *         minLength: 1
 *       assignmentUnit:
 *         type: string
 *         minLength: 1
 *       postExperimentRule:
 *         type: string
 *         minLength: 1
 *       enrollmentCompleteCondition: {}
 *       endOn: {}
 *       revertTo: {}
 *       tags:
 *         type: array
 *         items:
 *           required: []
 *           properties: {}
 *       group:
 *         type: string
 *         minLength: 1
 *       logging:
 *         type: boolean
 *       conditions:
 *         type: array
 *         uniqueItems: true
 *         minItems: 1
 *         items:
 *           required:
 *             - createdAt
 *             - updatedAt
 *             - versionNumber
 *             - id
 *             - twoCharacterId
 *             - name
 *             - description
 *             - conditionCode
 *             - assignmentWeight
 *           properties:
 *             createdAt:
 *               type: string
 *               minLength: 1
 *             updatedAt:
 *               type: string
 *               minLength: 1
 *             versionNumber:
 *               type: number
 *             id:
 *               type: string
 *               minLength: 1
 *             twoCharacterId:
 *               type: string
 *               minLength: 1
 *             name:
 *               type: string
 *               minLength: 1
 *             description:
 *               type: string
 *               minLength: 1
 *             conditionCode:
 *               type: string
 *               minLength: 1
 *             assignmentWeight:
 *               type: number
 *             order: {}
 *       partitions:
 *         type: array
 *         uniqueItems: true
 *         minItems: 1
 *         items:
 *           required:
 *             - createdAt
 *             - updatedAt
 *             - versionNumber
 *             - id
 *             - twoCharacterId
 *             - site
 *             - target
 *             - description
 *           properties:
 *             createdAt:
 *               type: string
 *               minLength: 1
 *             updatedAt:
 *               type: string
 *               minLength: 1
 *             versionNumber:
 *               type: number
 *             id:
 *               type: string
 *               minLength: 1
 *             twoCharacterId:
 *               type: string
 *               minLength: 1
 *             site:
 *               type: string
 *               minLength: 1
 *             target:
 *               type: string
 *               minLength: 1
 *             description:
 *               type: string
 *               minLength: 1
 *             order: {}
 *       queries:
 *         type: array
 *         items:
 *           required: []
 *           properties: {}
 *       stateTimeLogs:
 *         type: array
 *         uniqueItems: true
 *         minItems: 1
 *         items:
 *           required:
 *             - createdAt
 *             - updatedAt
 *             - versionNumber
 *             - id
 *             - fromState
 *             - toState
 *             - timeLog
 *           properties:
 *             createdAt:
 *               type: string
 *               minLength: 1
 *             updatedAt:
 *               type: string
 *               minLength: 1
 *             versionNumber:
 *               type: number
 *             id:
 *               type: string
 *               minLength: 1
 *             fromState:
 *               type: string
 *               minLength: 1
 *             toState:
 *               type: string
 *               minLength: 1
 *             timeLog:
 *               type: string
 *               minLength: 1
 *       experimentSegmentInclusion:
 *          type: object
 *          properties:
 *              segment:
 *                type: object
 *                properties:
 *                  individualForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        userId:
 *                          type: string
 *                          example: user1
 *                  groupForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        groupId:
 *                          type: string
 *                          example: school1
 *                        type:
 *                           type: string
 *                           example: schoolId
 *                  subSegments:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        id:
 *                          type: string
 *                        name:
 *                          type: string
 *                        context:
 *                          type: string
 *       experimentSegmentExclusion:
 *          type: object
 *          properties:
 *              segment:
 *                type: object
 *                properties:
 *                  individualForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        userId:
 *                          type: string
 *                          example: user1
 *                  groupForSegment:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        groupId:
 *                          type: string
 *                          example: school1
 *                        type:
 *                           type: string
 *                           example: schoolId
 *                  subSegments:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        id:
 *                          type: string
 *                        name:
 *                          type: string
 *                        context:
 *                          type: string
 *       conditionPayloads:
 *         type: array
 *         items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               payload:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: enum
 *                   value:
 *                     type: enum
 *               parentCondition:
 *                 type: object
 *               decisionPoint:
 *                 type: object
 *     required:
 *       - createdAt
 *       - updatedAt
 *       - versionNumber
 *       - id
 *       - name
 *       - description
 *       - context
 *       - state
 *       - consistencyRule
 *       - assignmentUnit
 *       - postExperimentRule
 *       - tags
 *       - group
 *       - logging
 *       - conditions
 *       - partitions
 *       - queries
 *       - stateTimeLogs
 */

/**
 * @swagger
 * tags:
 *   - name: Experiments
 *     description: CRUD operations related to experiments
 */
@Authorized()
@JsonController('/experiments')
export class ExperimentController {
  constructor(
    public experimentService: ExperimentService,
    public experimentAssignmentService: ExperimentAssignmentService
  ) {}

  /**
   * @swagger
   * /experiments/names:
   *    get:
   *       description: Get all the experiment names
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment Name List
   *            schema:
   *              type: array
   *              items:
   *                type: object
   *                required:
   *                  - id
   *                  - name
   *                properties:
   *                  id:
   *                    type: string
   *                  name:
   *                    type: string
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Get('/names')
  public findName(@Req() request: AppRequest): Promise<Array<Pick<Experiment, 'id' | 'name'>>> {
    return this.experimentService.findAllName(request.logger);
  }

  /**
   * @swagger
   * /experiments:
   *    get:
   *       description: Get all the experiments
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment List
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/definitions/ExperimentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Get()
  public find(@Req() request: AppRequest): Promise<ExperimentDTO[]> {
    return this.experimentService.find(request.logger);
  }

  /**
   * @swagger
   * /experiments/contextMetaData:
   *    get:
   *       description: Get contextMetaData
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: contextMetaData list
   *            schema:
   *              type: object
   *              properties:
   *                appContext:
   *                  type: array
   *                  items:
   *                    properties: {}
   *                expPoints:
   *                  type: array
   *                  items:
   *                    properties: {}
   *                expIds:
   *                  type: array
   *                  items:
   *                    properties: {}
   *                groupTypes:
   *                  type: array
   *                  items:
   *                    properties: {}
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Get('/contextMetaData')
  public getContextMetaData(@Req() request: AppRequest): object {
    return this.experimentService.getContextMetaData(request.logger);
  }

  /**
   * @swagger
   * /experiments/paginated:
   *    post:
   *       description: Get Paginated Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - skip
   *               - take
   *             properties:
   *               skip:
   *                type: integer
   *               take:
   *                type: integer
   *               searchParams:
   *                type: object
   *                properties:
   *                  key:
   *                    type: string
   *                    enum: [all, name, status, tag]
   *                  string:
   *                    type: string
   *               sortParams:
   *                  type: object
   *                  properties:
   *                    key:
   *                     type: string
   *                     enum: [name, status, createdAt]
   *                    sortAs:
   *                     type: string
   *                     enum: [ASC, DESC]
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Paginated Experiments
   *            schema:
   *              type: object
   *              properties:
   *                total:
   *                  type: number
   *                nodes:
   *                  type: array
   *                  items:
   *                    $ref: '#/definitions/ExperimentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Insert Error in database
   */
  @Post('/paginated')
  public async paginatedFind(
    @Body({ validate: true })
    paginatedParams: ExperimentPaginatedParamsValidator,
    @Req()
    request: AppRequest
  ): Promise<ExperimentPaginationInfo> {
    if (!paginatedParams) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.MISSING_PARAMS, message: ' : paginatedParams should not be null.' })
        )
      );
    }

    const [experiments, count] = await Promise.all([
      this.experimentService.findPaginated(
        paginatedParams.skip,
        paginatedParams.take,
        request.logger,
        paginatedParams.searchParams,
        paginatedParams.sortParams
      ),
      this.experimentService.getTotalCount(),
    ]);
    return {
      total: count,
      nodes: experiments,
      ...paginatedParams,
    };
  }

  /**
   * @swagger
   * /experiments/partitions:
   *    get:
   *       description: Get all experiment partitions
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get All Experiment Partitions
   *            schema:
   *               type: array
   *               description: ''
   *               minItems: 1
   *               uniqueItems: true
   *               items:
   *                 type: object
   *                 required:
   *                   - site
   *                   - target
   *                 properties:
   *                   site:
   *                     type: string
   *                     minLength: 1
   *                     example: SelectSection
   *                   target:
   *                     type: string
   *                     minLength: 1
   *                     example: using_fractions
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment Partitions not found
   */
  @Get('/partitions')
  public getAllExperimentPoints(@Req() request: AppRequest): Promise<Array<Pick<DecisionPoint, 'site' | 'target'>>> {
    return this.experimentService.getAllExperimentPartitions(request.logger);
  }

  /**
   * @swagger
   * /experiments/single/{id}:
   *    get:
   *       description: Get experiment by id
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Experiment By Id
   *            schema:
   *              $ref: '#/definitions/ExperimentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment not found
   *          '500':
   *            description: id should be of type UUID
   */
  @Get('/single/:id')
  @OnUndefined(ExperimentNotFoundError)
  public one(@Param('id') id: string, @Req() request: AppRequest): Promise<ExperimentDTO> | undefined {
    if (!isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentService.getSingleExperiment(id, request.logger);
  }

  /**
   * @swagger
   * /experiments/conditions/{id}:
   *    get:
   *       description: Get experiment conditions
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Experiment By Id
   *            schema:
   *              type: array
   *              description: ''
   *              minItems: 1
   *              uniqueItems: true
   *              items:
   *                type: object
   *                required:
   *                  - createdAt
   *                  - updatedAt
   *                  - versionNumber
   *                  - id
   *                  - twoCharacterId
   *                  - name
   *                  - description
   *                  - conditionCode
   *                  - assignmentWeight
   *                properties:
   *                  createdAt:
   *                    type: string
   *                    minLength: 1
   *                  updatedAt:
   *                    type: string
   *                    minLength: 1
   *                  versionNumber:
   *                    type: number
   *                  id:
   *                    type: string
   *                    minLength: 1
   *                  twoCharacterId:
   *                    type: string
   *                    minLength: 1
   *                  name:
   *                    type: string
   *                    minLength: 1
   *                  description:
   *                    type: string
   *                    minLength: 1
   *                  conditionCode:
   *                    type: string
   *                    minLength: 1
   *                  assignmentWeight:
   *                    type: number
   *                  order: {}
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment not found
   *          '500':
   *            description: id should be of type UUID
   */
  @Get('/conditions/:id')
  @OnUndefined(ExperimentNotFoundError)
  public getCondition(@Param('id') id: string, @Req() request: AppRequest): Promise<ExperimentCondition[]> {
    if (!isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentService.getExperimentalConditions(id, request.logger);
  }

  /**
   * @swagger
   * /experiments:
   *    post:
   *       description: Create New Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experiment
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/Experiment'
   *           description: Experiment Structure
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Experiment is created
   *            schema:
   *              $ref: '#/definitions/ExperimentResponse'
   *          '400':
   *            description: default as ConditionCode is not allowed
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Insert Error in database
   */

  @Post()
  public create(
    @Body({ validate: true }) experiment: ExperimentDTO,
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO> {
    request.logger.child({ user: currentUser });
    return this.experimentService.create(experiment, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/batch:
   *    post:
   *       description: Generate New Experiments
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experiments
   *           required: true
   *           schema:
   *             type: array
   *             items:
   *               $ref: '#/definitions/Experiment'
   *           description: Experiment Structure
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Experiment is created
   *            schema:
   *              $ref: '#/definitions/ExperimentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Insert Error in database
   */

  @Post('/batch')
  public createMultipleExperiments(
    @Body({ validate: true, type: ExperimentDTO }) experiment: ExperimentDTO[],
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO[]> {
    request.logger.child({ user: currentUser });
    return this.experimentService.createMultipleExperiments(experiment, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/{id}:
   *    delete:
   *       description: Delete experiment by id
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete Experiment By Id
   *            schema:
   *              $ref: '#/definitions/ExperimentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Not found error
   *          '500':
   *            description: id should be of type UUID
   */

  @Delete('/:id')
  public delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<Experiment | undefined> {
    if (!isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    request.logger.child({ user: currentUser });
    return this.experimentService.delete(id, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/state:
   *    post:
   *       description: Update Experiment State
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: data
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               experimentId:
   *                type: string
   *               state:
   *                type: string
   *                $ref: '#/definitions/Experiment/state'
   *           description: Experiment State
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment State is updated
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: id should be of type UUID, invalid input value for enum 'state' violates not-null constrain
   */
  @Post('/state')
  public async updateState(
    @Body({ validate: true })
    experiment: AssignmentStateUpdateValidator,
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<any> {
    if (env.auth.authCheck) {
      if (!currentUser) {
        return Promise.reject(
          new Error(JSON.stringify({ type: SERVER_ERROR.MISSING_PARAMS, message: ' : currentUser should not be null' }))
        );
      }

      await validate(currentUser).catch((error) => {
        return Promise.reject(new Error(error));
      });
    }

    return this.experimentService.updateState(
      experiment.experimentId,
      experiment.state,
      currentUser,
      request.logger,
      experiment.scheduleDate
    );
  }

  /**
   * @swagger
   * /experiments/{id}:
   *    put:
   *       description: Create New Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *         - in: body
   *           name: experiment
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/Experiment'
   *           description: Experiment Structure
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment is updated
   *            schema:
   *              $ref: '#/definitions/ExperimentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: invalid input syntax for type uuid, Error in experiment scheduler (user is not authorized), Insert Error in database
   */
  @Put('/:id')
  public update(
    @Param('id') id: string,
    @Body({ validate: true })
    experiment: ExperimentDTO,
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO> {
    if (!isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    request.logger.child({ user: currentUser });
    return this.experimentService.update(experiment, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/{import}:
   *    put:
   *       description: Import New Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment is imported
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Post('/import')
  public importExperiment(
    @Body({ validate: true, type: ExperimentDTO })
    experiments: ExperimentDTO[],
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO[]> {
    return this.experimentService.importExperiment(experiments, currentUser, request.logger);
  }

  @Post('/export')
  public exportExperiment(
    @Body({ validate: true, type: String }) ids: string[],
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO[]> {
    return this.experimentService.exportExperiment(ids, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/getGroupAssignmentStatus/{id}:
   *    get:
   *       description: Get all the groups assignment status having met the ending criteria
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment List
   *            schema:
   *              type: number
   *              items:
   *                $ref: '#/definitions/ExperimentResponse'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Not found error
   *          '500':
   *            description: id should be of type UUID
   */
  @Get('/getGroupAssignmentStatus/:id')
  @OnUndefined(ExperimentNotFoundError)
  public async getGroupAssignmentStatus(
    @Param('id') id: string,
    @Req() request: AppRequest
  ): Promise<number> | undefined {
    if (!isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentAssignmentService.getGroupAssignmentStatus(id, request.logger);
  }
}
