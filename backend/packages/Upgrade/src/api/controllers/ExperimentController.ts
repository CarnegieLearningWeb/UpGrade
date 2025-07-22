import {
  Body,
  Get,
  JsonController,
  OnUndefined,
  Post,
  Put,
  Delete,
  Authorized,
  CurrentUser,
  Req,
  QueryParams,
  Params,
  BadRequestError,
  Res,
} from 'routing-controllers';
import { Experiment } from '../models/Experiment';
import { ExperimentNotFoundError } from '../errors/ExperimentNotFoundError';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentPaginatedParamsValidator } from './validators/ExperimentPaginatedParamsValidator';
import { UserDTO } from '../DTO/UserDTO';
import { DecisionPoint } from '../models/DecisionPoint';
import { AssignmentStateUpdateValidator } from './validators/AssignmentStateUpdateValidator';
import { AppRequest, PaginationResponse } from '../../types';
import { ExperimentDTO, ExperimentFile, ValidatedExperimentError } from '../DTO/ExperimentDTO';
import { ExperimentIds } from './validators/ExperimentIdsValidator';
import { MoocletExperimentService } from '../services/MoocletExperimentService';
import { env } from '../../env';
import { Response } from 'express';
import { NotFoundException } from '@nestjs/common/exceptions';
import { ExperimentIdValidator } from '../DTO/ExperimentDTO';
import { IImportError, LIST_FILTER_MODE, SERVER_ERROR, SUPPORTED_MOOCLET_ALGORITHMS } from 'upgrade_types';
import { ImportExportService } from '../services/ImportExportService';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
import { SegmentInputValidator } from '../controllers/validators/SegmentInputValidator';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';
import { IdValidator } from '../controllers/validators/ExperimentUserValidator';
import { Segment } from '../models/Segment';

interface ExperimentPaginationInfo extends PaginationResponse {
  nodes: Experiment[];
}

interface ExperimentListValidator {
  list: SegmentInputValidator;
  experimentId: string;
}

interface ExperimentListImportValidation {
  files: ExperimentFile[];
  experimentId: string;
  filterType: LIST_FILTER_MODE;
}

/**
 * @swagger
 * definitions:
 *   InclusionExclusionListInput:
 *     required:
 *      - name
 *      - context
 *      - type
 *      - listType
 *      - userIds
 *      - groups
 *      - subSegmentIds
 *     properties:
 *       id:
 *        type: string
 *       name:
 *        type: string
 *       description:
 *        type: string
 *       context:
 *        type: string
 *       type:
 *        type: string
 *        enum: [private]
 *       listType:
 *        type: string
 *       userIds:
 *        type: array
 *        items:
 *          type: string
 *       groups:
 *        type: array
 *        items:
 *          type: object
 *          properties:
 *            groupId:
 *              type: string
 *            type:
 *              type: string
 *       subSegmentIds:
 *        type: array
 *        items:
 *          type: string
 *   InclusionExclusionList:
 *     required:
 *       - name
 *       - context
 *       - type
 *       - individualForSegment
 *       - groupForSegment
 *       - subSegments
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       context:
 *         type: string
 *       listType:
 *         type: string
 *       type:
 *         type: string
 *         enum: [private]
 *       individualForSegment:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *       groupForSegment:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             groupId:
 *               type: string
 *             type:
 *               type: string
 *       subSegments:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: 218dc2d8-a833-4e06-b3e3-d3adf74bffd6
 *             name:
 *               type: string
 *             context:
 *               type: string
 *   Experiment:
 *     required:
 *       - name
 *       - context
 *       - state
 *       - tags
 *       - filterMode
 *       - consistencyRule
 *       - assignmentUnit
 *       - postExperimentRule
 *       - conditions
 *       - partitions
 *       - conditionPayload
 *       - type
 *     properties:
 *       id:
 *         type: string
 *         example: aa309c70-00cb-4b6c-8a43-5df4a8f033f0
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
 *          example: c4cc5b08-1c10-4179-a291-a05cde6ce86b
 *       tags:
 *          type: array
 *          items:
 *            type: string
 *       group:
 *         type: string
 *       assignmentAlgorithm:
 *         type: string
 *         enum: [random, stratified random sampling]
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
 *               id:
 *                type: string
 *                example: 7bc4b206-a3a2-403d-9b86-f62495f13d39
 *               order:
 *                type: number
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
 *             id:
 *                type: string
 *                example: 4b4cc8da-d9d0-4148-b79d-a03a4af34535
 *             order:
 *                type: number
 *       factors:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             order:
 *               type: number
 *             levels:
 *               type: array
 *               items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    example: 09a93774-04d0-4005-87cc-1b94a454703a
 *                  name:
 *                    type: string
 *                  description:
 *                    type: string
 *                  payload:
 *                    type: object
 *                    properties:
 *                      type:
 *                        type: string
 *                        enum: [string, json, csv]
 *                      value:
 *                        type: string
 *       queries:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *            name:
 *              type: string
 *            query:
 *              type: object
 *            metric:
 *              type: object
 *              properties:
 *                key:
 *                  type: string
 *            repeatedMeasure:
 *              type: string
 *              enum: [MEAN, EARLIEST, PERCENTAGE]
 *       experimentSegmentInclusion:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             segment:
 *               type: object
 *               $ref: '#/definitions/InclusionExclusionList'
 *       experimentSegmentExclusion:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             segment:
 *               type: object
 *               $ref: '#/definitions/InclusionExclusionList'
 *       type:
 *         type: string
 *         enum: [Simple, Factorial]
 *       conditionPayloads:
 *         type: array
 *         items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: 0e0dd761-b570-4cb9-b0b7-d60bd3a64141
 *               parentCondition:
 *                 type: string
 *                 example: 7bc4b206-a3a2-403d-9b86-f62495f13d39
 *               decisionPoint:
 *                 type: string
 *                 example: 4b4cc8da-d9d0-4148-b79d-a03a4af34535
 *               payload:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [string, json, csv]
 *                   value:
 *                     type: string
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
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             segment:
 *               type: object
 *               properties:
 *                 individualForSegment:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: user1
 *                 groupForSegment:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                         example: school1
 *                       type:
 *                         type: string
 *                         example: schoolId
 *                 subSegments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       context:
 *                         type: string
 *       experimentSegmentExclusion:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             segment:
 *               type: object
 *               properties:
 *                 individualForSegment:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: user1
 *                 groupForSegment:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                         example: school1
 *                       type:
 *                         type: string
 *                         example: schoolId
 *                 subSegments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       context:
 *                         type: string
 *       conditionPayloads:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             payload:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                 value:
 *                   type: string
 *             parentCondition:
 *               type: object
 *             decisionPoint:
 *               type: object
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
    public experimentAssignmentService: ExperimentAssignmentService,
    public moocletExperimentService: MoocletExperimentService,
    public importExportService: ImportExportService
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
    const [experiments, count] = await this.experimentService.findPaginated(
      paginatedParams.skip,
      paginatedParams.take,
      request.logger,
      paginatedParams.searchParams,
      paginatedParams.sortParams
    );

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
   *          '400':
   *            description: ExperimentId should be a valid UUID.
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment not found
   *          '500':
   *            description: id should be of type UUID
   */
  @Get('/single/:id')
  @OnUndefined(ExperimentNotFoundError)
  public async one(
    @Params({ validate: true }) { id }: ExperimentIdValidator,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO> {
    let experiment = await this.experimentService.getSingleExperiment(id, request.logger);

    if (SUPPORTED_MOOCLET_ALGORITHMS.includes(experiment?.assignmentAlgorithm)) {
      if (!env.mooclets?.enabled) {
        throw new BadRequestError(
          'MoocletPolicyParameters are present in the experiment but Mooclet is not enabled in the environment'
        );
      } else {
        experiment = await this.moocletExperimentService.attachRewardKeyAndPolicyParamsToExperimentDTO(
          experiment,
          request.logger
        );
      }
    }
    return experiment;
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
   *          '400':
   *            description: ExperimentId should be a valid UUID.
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment not found
   *          '500':
   *            description: id should be of type UUID
   */
  @Get('/conditions/:id')
  @OnUndefined(ExperimentNotFoundError)
  public async getCondition(
    @Params({ validate: true }) { id }: ExperimentIdValidator,
    @Req() request: AppRequest
  ): Promise<ExperimentCondition[]> {
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
   *          '422':
   *            description: Experiment is not valid for current configuration
   *          '500':
   *            description: Insert Error in database
   */

  @Post()
  public create(
    @Body({ validate: true }) experiment: ExperimentDTO,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO> {
    request.logger.child({ user: currentUser });

    const contextValidationError = this.experimentService.validateExperimentContext(experiment);
    if (contextValidationError) {
      throw new BadRequestError(contextValidationError);
    }

    if ('moocletPolicyParameters' in experiment) {
      if (!env.mooclets?.enabled) {
        throw new BadRequestError(
          'Failed to create Experiment: moocletPolicyParameters was provided but mooclets are not enabled on backend.'
        );
      } else {
        return this.moocletExperimentService.syncCreate({
          experimentDTO: experiment,
          currentUser,
          logger: request.logger,
        });
      }
    }

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
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO[]> {
    request.logger.child({ user: currentUser });
    return this.importExportService.createMultipleExperiments(experiment, currentUser, request.logger);
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
   *          '400':
   *            description: ExperimentId should be a valid UUID.
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Not found error
   *          '500':
   *            description: id should be of type UUID
   */

  @Delete('/:id')
  public async delete(
    @Params({ validate: true }) { id }: ExperimentIdValidator,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<Experiment | undefined> {
    request.logger.child({ user: currentUser });

    // Manually check if the experiment has a mooclet ref
    if (env.mooclets.enabled) {
      const moocletExperimentRef = await this.moocletExperimentService.getMoocletExperimentRefByUpgradeExperimentId(id);

      if (moocletExperimentRef) {
        return await this.moocletExperimentService.syncDelete({
          moocletExperimentRef,
          experimentId: id,
          currentUser,
          logger: request.logger,
        });
      }
    }

    const experiment = await this.experimentService.delete(id, currentUser, { logger: request.logger });

    if (!experiment) {
      throw new NotFoundException('Experiment not found.');
    }
    return experiment;
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
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<any> {
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
   * /experiments/:id:
   *   put:
   *     description: Update Experiment
   *     consumes:
   *       - application/json
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Experiment Id
   *       - in: body
   *         name: experiment
   *         required: true
   *         schema:
   *           $ref: '#/definitions/Experiment'
   *         description: Experiment Structure
   *     tags:
   *       - Experiments
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *         description: Experiment is updated
   *         schema:
   *           $ref: '#/definitions/ExperimentResponse'
   *       '401':
   *         description: AuthorizationRequiredError
   *       '500':
   *         description: invalid input syntax for type uuid, Error in experiment scheduler (user is not authorized), Insert Error in database
   */
  @Put('/:id')
  public update(
    @Params({ validate: true }) { id }: ExperimentIdValidator,
    @Body({ validate: true })
    experiment: ExperimentDTO,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO> {
    request.logger.child({ user: currentUser });

    const contextValidationError = this.experimentService.validateExperimentContext(experiment);
    if (contextValidationError) {
      throw new BadRequestError(contextValidationError);
    }

    // TODO: there is a story to refactor these duplicate warnings, adding here same way as others for now
    if ('moocletPolicyParameters' in experiment) {
      if (!env.mooclets?.enabled) {
        throw new BadRequestError(
          'Failed to edit Experiment: moocletPolicyParameters was provided but mooclets are not enabled on backend.'
        );
      } else {
        return this.moocletExperimentService.syncUpdate({
          experimentDTO: { ...experiment, id },
          currentUser,
          logger: request.logger,
        });
      }
    }

    return this.experimentService.update({ ...experiment, id }, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/{validation}:
   *    post:
   *       description: Validating Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experiments
   *           required: true
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 fileContent:
   *                   type: string
   *           description: Experiment Files
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Validations are completed
   *            schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 error:
   *                   type: string
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Post('/validation')
  public validateExperiment(
    @Body({ validate: false }) experiments: ExperimentFile[],
    @Req() request: AppRequest
  ): Promise<ValidatedExperimentError[]> {
    return this.experimentService.validateExperiments(experiments, request.logger);
  }

  /**
   * @swagger
   * /experiments/{import}:
   *    post:
   *       description: Import New Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experiments
   *           required: true
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 fileContent:
   *                   type: string
   *           description: Experiment Files
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment is imported
   *            schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 error:
   *                   type: string
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Post('/import')
  public async importExperiment(
    @Body({ validate: true })
    experiments: ExperimentFile[],
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ValidatedExperimentError[]> {
    const validatedExperiments = await this.importExportService.importExperiments(
      experiments,
      currentUser,
      request.logger
    );

    return validatedExperiments;
  }

  /**
   * @swagger
   * /experiments/{export}:
   *    get:
   *       description: Export Experiment JSON
   *       parameters:
   *         - in: body
   *           name: experiments
   *           required: true
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 fileContent:
   *                   type: string
   *           description: Experiment Files
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment is exported
   *            schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 error:
   *                   type: string
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Get('/export')
  public exportExperiment(
    @QueryParams()
    params: ExperimentIds,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO[]> {
    const experimentIds = params.ids;
    return this.importExportService.exportExperiment(currentUser, request.logger, experimentIds);
  }

  /**
   * @swagger
   * /experiments/all:
   *    get:
   *       description: Export All Experiment JSON
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiments are exported
   *            schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 fileName:
   *                   type: string
   *                 error:
   *                   type: string
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Get('/export/all')
  public exportAllExperiment(
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentDTO[]> {
    return this.importExportService.exportExperiment(currentUser, request.logger);
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
   *          '400':
   *            description: ExperimentId should be a valid UUID.
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
    @Params({ validate: true }) { id }: ExperimentIdValidator,
    @Req() request: AppRequest
  ): Promise<number> | undefined {
    return this.experimentAssignmentService.getGroupAssignmentStatus(id, request.logger);
  }

  /**
   * @swagger
   * /experiments/inclusionList:
   *    post:
   *       description: Add Experiment Inclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: add inclusionList
   *           description: Adding an inclusion list to the experiment
   *           schema:
   *             type: object
   *             properties:
   *               experimentId:
   *                 type: string
   *                 description: The ID of the experiment to which the inclusion list is being added.
   *               list:
   *                type: object
   *                $ref: '#/definitions/InclusionExclusionListInput'
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Experiment inclusion list is added
   */
  @Post('/inclusionList')
  public async addInclusionList(
    @Body({ validate: true }) experimentListInput: ExperimentListValidator,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentSegmentInclusion> {
    return await this.experimentService.addList(
      experimentListInput.list,
      experimentListInput.experimentId,
      LIST_FILTER_MODE.INCLUSION,
      currentUser,
      request.logger
    );
  }

  /**
   * @swagger
   * /experiments/exclusionList:
   *    post:
   *       description: Add Experiment Exclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: add exclusionList
   *           description: Adding an exclusion list to the experiment
   *           schema:
   *             type: object
   *             properties:
   *               experimentId:
   *                 type: string
   *                 description: The ID of the experiment to which the exclusion list is being added.
   *               list:
   *                type: object
   *                $ref: '#/definitions/InclusionExclusionListInput'
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Experiment exclusion list is added
   */
  @Post('/exclusionList')
  public async addExclusionList(
    @Body({ validate: true }) experimentListInput: ExperimentListValidator,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentSegmentExclusion> {
    return await this.experimentService.addList(
      experimentListInput.list,
      experimentListInput.experimentId,
      LIST_FILTER_MODE.EXCLUSION,
      currentUser,
      request.logger
    );
  }

  /**
   * @swagger
   * /experiments/inclusionList/{id}:
   *    put:
   *       description: Update Experiment Inclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: ID of the segment
   *         - in: body
   *           name: updateInclusionList
   *           description: Updating an inclusion list on the experiment
   *           schema:
   *             type: object
   *             properties:
   *               experimentId:
   *                 type: string
   *                 description: The ID of the experiment to which the inclusion list is being added.
   *               list:
   *                type: object
   *                $ref: '#/definitions/InclusionExclusionListInput'
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment inclusion list is updated
   */
  @Put('/inclusionList/:id')
  public async updateInclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @Body({ validate: true }) experimentListInput: ExperimentListValidator,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentSegmentInclusion> {
    if (id !== experimentListInput.list.id) {
      return Promise.reject(
        new Error(
          `${SERVER_ERROR.INCORRECT_PARAM_FORMAT}: The id in the URL (${id}) does not match the list id in the request body (${experimentListInput.list.id}).`
        )
      );
    }
    return this.experimentService.updateList(
      experimentListInput.list,
      experimentListInput.experimentId,
      LIST_FILTER_MODE.INCLUSION,
      currentUser,
      request.logger
    );
  }

  /**
   * @swagger
   * /experiments/exclusionList/{id}:
   *    put:
   *       description: Update Experiment Exclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: ID of the segment
   *         - in: body
   *           name: updateExclusionList
   *           description: Updating an exclusion list on the experiment
   *           schema:
   *             type: object
   *             properties:
   *               experimentId:
   *                 type: string
   *                 description: The ID of the experiment to which the exclusion list is being added.
   *               list:
   *                type: object
   *                $ref: '#/definitions/InclusionExclusionListInput'
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment exclusion list is updated
   */
  @Put('/exclusionList/:id')
  public async updateExclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @Body({ validate: true }) experimentListInput: ExperimentListValidator,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<ExperimentSegmentExclusion> {
    if (id !== experimentListInput.list.id) {
      return Promise.reject(
        new Error(
          `${SERVER_ERROR.INCORRECT_PARAM_FORMAT}: The id in the URL (${id}) does not match the list id in the request body (${experimentListInput.list.id}).`
        )
      );
    }
    return this.experimentService.updateList(
      experimentListInput.list,
      experimentListInput.experimentId,
      LIST_FILTER_MODE.EXCLUSION,
      currentUser,
      request.logger
    );
  }

  /**
   * @swagger
   * /experiments/inclusionList/{id}:
   *    delete:
   *       description: Delete Experiment Inclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Segment Id of private segment
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete Experiment Inclusion List by segment Id
   */
  @Delete('/inclusionList/:id')
  public async deleteInclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.experimentService.deleteList(id, LIST_FILTER_MODE.INCLUSION, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/exclusionList/{id}:
   *    delete:
   *       description: Delete Experiment Exclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Segment Id of private segment
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete Experiment Exclusion List by segment Id
   */
  @Delete('/exclusionList/:id')
  public async deleteExclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.experimentService.deleteList(id, LIST_FILTER_MODE.EXCLUSION, currentUser, request.logger);
  }

  /**
   * @swagger
   * /experiments/lists/import:
   *    post:
   *       description: Importing Experiment List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: lists
   *           description: Import Experiment List Files
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/ExperimentListImportObject'
   *       tags:
   *         - Experiment Lists
   *       produces:
   *         - application/json
   *       responses:
   *         '200':
   *           description: New Experiment list is imported
   *         '401':
   *           description: AuthorizationRequiredError
   *         '500':
   *           description: Internal Server Error
   */
  @Post('/lists/import')
  public async importExperimentLists(
    @Body({ validate: true }) lists: ExperimentListImportValidation,
    @CurrentUser() currentUser: UserDTO,
    @Req() request: AppRequest
  ): Promise<IImportError[]> {
    return await this.experimentService.importExperimentLists(
      lists.files,
      lists.experimentId,
      lists.filterType,
      currentUser,
      request.logger
    );
  }

  /**
   * @swagger
   * /experiments/export/includeLists/{id}:
   *    get:
   *      description: Export All Include lists of Experiment JSON
   *      tags:
   *        - Experiments
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          id: Id
   *          description: Experiment Id
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Get Experiment's All Include Lists JSON
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Experiment not found
   *        '400':
   *          description: id must be a UUID
   *        '500':
   *          description: Internal Server Error
   */
  @Get('/export/includeLists/:id')
  public async exportAllIncludeLists(
    @Params({ validate: true }) { id }: IdValidator,
    @Req() request: AppRequest,
    @Res() response: Response
  ): Promise<SegmentInputValidator[]> {
    const lists = await this.experimentService.exportAllLists(id, LIST_FILTER_MODE.INCLUSION, request.logger);
    if (lists?.length) {
      // download JSON file with appropriate headers to response body;
      if (lists.length === 1) {
        response.setHeader('Content-Disposition', `attachment; filename="${lists[0].name}.json"`);
      } else {
        response.setHeader('Content-Disposition', `attachment; filename="lists.zip"`);
      }
      response.setHeader('Content-Type', 'application/json');
    } else {
      throw new NotFoundException('Include lists not found.');
    }

    return lists;
  }

  /**
   * @swagger
   * /experiments/export/excludeLists/{id}:
   *    get:
   *      description: Export All Exclude lists of Experiment JSON
   *      tags:
   *        - Experiments
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          flagId: Id
   *          description: Experiment Id
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Get Experiment's All Exclude Lists JSON
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Experiment not found
   *        '400':
   *          description: id must be a UUID
   *        '500':
   *          description: Internal Server Error
   */
  @Get('/export/excludeLists/:id')
  public async exportAllExcludeLists(
    @Params({ validate: true }) { id }: IdValidator,
    @Req() request: AppRequest,
    @Res() response: Response
  ): Promise<SegmentInputValidator[]> {
    const lists = await this.experimentService.exportAllLists(id, LIST_FILTER_MODE.EXCLUSION, request.logger);
    if (lists?.length) {
      // download JSON file with appropriate headers to response body;
      if (lists.length === 1) {
        response.setHeader('Content-Disposition', `attachment; filename="${lists[0].name}.json"`);
      } else {
        response.setHeader('Content-Disposition', `attachment; filename="lists.zip"`);
      }
      response.setHeader('Content-Type', 'application/json');
    } else {
      throw new NotFoundException('Exclude lists not found.');
    }

    return lists;
  }
}
