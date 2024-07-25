import { JsonController, Authorized, Post, Body, Delete, Put, Req, Get, Params } from 'routing-controllers';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { FeatureFlag } from '../models/FeatureFlag';
import { FeatureFlagSegmentExclusion } from '../models/FeatureFlagSegmentExclusion';
import { FeatureFlagSegmentInclusion } from '../models/FeatureFlagSegmentInclusion';
import { FeatureFlagStatusUpdateValidator } from './validators/FeatureFlagStatusUpdateValidator';
import { FeatureFlagPaginatedParamsValidator } from './validators/FeatureFlagsPaginatedParamsValidator';
import { AppRequest, PaginationResponse } from '../../types';
import { SERVER_ERROR } from 'upgrade_types';
import { FeatureFlagValidation, IdValidator, UserParamsValidator } from './validators/FeatureFlagValidator';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { FeatureFlagListValidator } from '../controllers/validators/FeatureFlagListValidator';
import { Segment } from 'src/api/models/Segment';

interface FeatureFlagsPaginationInfo extends PaginationResponse {
  nodes: FeatureFlag[];
}

export interface FeatureFlagFormData {
  name: string;
  key: string;
  description: string;
  appContext: string;
  tags: string[];
}

/**
 * @swagger
 * definitions:
 *   FeatureFlag:
 *     required:
 *       - id
 *       - name
 *       - key
 *       - description
 *       - status
 *       - context
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 *       key:
 *         type: string
 *       description:
 *         type: string
 *       status:
 *         type: string
 *         enum: [archived, enabled, disabled]
 *       context:
 *         type: array
 *         items:
 *           type: string
 *       tags:
 *         type: array
 *         items:
 *           type: string
 *         filterMode:
 *           type: string
 *           enum: [includeAll, excludeAll]
 *   FeatureFlagInclusionExclusionList:
 *     required:
 *      - name
 *      - context
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
 *   FeatureFlagSegmentListInput:
 *    required:
 *      - flagId
 *      - enabled
 *      - listType
 *      - list
 *    properties:
 *      flagId:
 *        type: string
 *      enabled:
 *        type: boolean
 *      listType:
 *        type: string
 *      list:
 *        type: object
 *        $ref: '#/definitions/FeatureFlagInclusionExclusionList'
 */

/**
 * @swagger
 * tags:
 *   - name: Feature Flags
 *     description: Get Feature flags related data
 */

@Authorized()
@JsonController('/flags')
export class FeatureFlagsController {
  constructor(public featureFlagService: FeatureFlagService, public experimentUserService: ExperimentUserService) {}

  /**
   * @swagger
   * /flags:
   *    get:
   *       description: Get all the feature flags
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Feature Flag List
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/definitions/FeatureFlag'
   *          '401':
   *            description: AuthorizationRequiredError
   */

  @Get()
  public find(@Req() request: AppRequest): Promise<FeatureFlag[]> {
    return this.featureFlagService.find(request.logger);
  }

  @Post('/keys')
  public async getKeys(
    @Body({ validate: true })
    userParams: UserParamsValidator,
    @Req() request: AppRequest
  ): Promise<string[]> {
    const experimentUserDoc = await this.experimentUserService.getUserDoc(userParams.userId, request.logger);
    if (!experimentUserDoc) {
      const error = new Error(`User not defined in markExperimentPoint: ${userParams.userId}`);
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404;
      request.logger.error(error);
      throw error;
    }
    return this.featureFlagService.getKeys(experimentUserDoc, userParams.context, request.logger);
  }

  /**
   * @swagger
   * /flags/{id}:
   *    get:
   *       description: Get feature flag by id
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Feature Flag Id
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Feature Flag By Id
   *            schema:
   *                $ref: '#/definitions/FeatureFlag'
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Feature Flag not found
   *          '500':
   *            description: id should be of type UUID
   */
  @Get('/:id')
  public findOne(
    @Params({ validate: true }) { id }: IdValidator,
    @Req() request: AppRequest
  ): Promise<FeatureFlag | undefined> {
    return this.featureFlagService.findOne(id, request.logger);
  }

  /**
   * @swagger
   * /flags/paginated:
   *    post:
   *       description: Get Paginated Feature Flags
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
   *                    enum: [all, name, key, status, tag, context]
   *                  string:
   *                    type: string
   *               sortParams:
   *                  type: object
   *                  properties:
   *                    key:
   *                     type: string
   *                     enum: [name, key, status, updatedAt]
   *                    sortAs:
   *                     type: string
   *                     enum: [ASC, DESC]
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Paginated Feature Flags
   */

  @Post('/paginated')
  public async paginatedFind(
    @Body({ validate: true })
    paginatedParams: FeatureFlagPaginatedParamsValidator,
    @Req() request: AppRequest
  ): Promise<FeatureFlagsPaginationInfo> {
    if (!paginatedParams) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.MISSING_PARAMS, message: ' : paginatedParams should not be null.' })
        )
      );
    }

    const [featureFlags, count] = await Promise.all([
      this.featureFlagService.findPaginated(
        paginatedParams.skip,
        paginatedParams.take,
        request.logger,
        paginatedParams.searchParams,
        paginatedParams.sortParams
      ),
      this.featureFlagService.getTotalCount(),
    ]);
    return {
      total: count,
      nodes: featureFlags,
      ...paginatedParams,
    };
  }

  /**
   * @swagger
   * /flags:
   *    post:
   *       description: Create New flag
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: flag
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/FeatureFlag'
   *           description: Feature flag structure
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Feature flag is created
   */
  @Post()
  public create(
    @Body({ validate: true }) flag: FeatureFlagValidation,
    @Req() request: AppRequest
  ): Promise<FeatureFlag> {
    return this.featureFlagService.create(flag, request.logger);
  }

  /**
   * @swagger
   * /flags/validation:
   *    post:
   *       description: Check for duplicate feature flags name or key
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: flag
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/FeatureFlag'
   *           description: Feature flag structure
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Feature flag name or key is unique
   *          '409':
   *            description: Feature flag name or key already exists
   */
  @Post('/validation')
  public validateFeatureFlags(
    @Body({ validate: false }) flag: FeatureFlagFormData,
    @Req() request: AppRequest
  ): Promise<string> {
    return this.featureFlagService.validate(flag, request.logger);
  }
  /**
   * @swagger
   * /flags/status:
   *    post:
   *       description: Update Feature flag State
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: statusUpdate
   *           description: Updating the featur flag's status
   *           schema:
   *             type: object
   *             required:
   *              - flagId
   *              - status
   *             properties:
   *              flagId:
   *                type: string
   *              status:
   *                type: string
   *                enum: [archived, enabled, disabled]
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Feature flag state is updated
   */
  @Post('/status')
  public async updateState(
    @Body({ validate: true })
    flag: FeatureFlagStatusUpdateValidator
  ): Promise<FeatureFlag> {
    return this.featureFlagService.updateState(flag.flagId, flag.status);
  }

  /**
   * @swagger
   * /flags/{id}:
   *    delete:
   *       description: Delete feature flag by id
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Feature flag Id
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete Feature flag By Id
   */

  @Delete('/:id')
  public delete(
    @Params({ validate: true }) { id }: IdValidator,
    @Req() request: AppRequest
  ): Promise<FeatureFlag | undefined> {
    return this.featureFlagService.delete(id, request.logger);
  }

  /**
   * @swagger
   * /flags/{id}:
   *    put:
   *       description: Update feature flags by id
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Feature flag Id
   *         - in: body
   *           name: flag
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/FeatureFlag'
   *           description: Feature Flag Structure
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Feature flags is updated
   */
  @Put('/:id')
  public update(
    @Params({ validate: true }) { id }: IdValidator,
    @Body({ validate: true })
    flag: FeatureFlagValidation,
    @Req() request: AppRequest
  ): Promise<FeatureFlag> {
    return this.featureFlagService.update(flag, request.logger);
  }

  /**
   * @swagger
   * /flags/inclusionList:
   *    post:
   *       description: Add Feature Flag Inclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: addinclusionList
   *           description: Adding an inclusion list to the feature flag
   *           schema:
   *             type: object
   *             $ref: '#/definitions/FeatureFlagSegmentListInput'
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Feature flag inclusion list is added
   */
  @Post('/inclusionList')
  public async addInclusionList(
    @Body({ validate: true }) inclusionList: FeatureFlagListValidator,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentInclusion> {
    return this.featureFlagService.addList(inclusionList, 'inclusion', request.logger);
  }

  /**
   * @swagger
   * /flags/exclusionList:
   *    post:
   *       description: Add Feature Flag Exclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: addExclusionList
   *           description: Adding an exclusion list to the feature flag
   *           schema:
   *             type: object
   *             $ref: '#/definitions/FeatureFlagSegmentListInput'
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Feature flag exclusion list is added
   */
  @Post('/exclusionList')
  public async addExclusionList(
    @Body({ validate: true }) exclusionList: FeatureFlagListValidator,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentExclusion> {
    return this.featureFlagService.addList(exclusionList, 'exclusion', request.logger);
  }

  /**
   * @swagger
   * /flags/exclusionList:
   *    put:
   *       description: Update Feature Flag Exclusion List
   *       consumes:
   *         - application/json
   *       parameters:
   *        - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: ID of the segment
   *         - in: body
   *           name: updateExclusionList
   *           description: Updating an exclusion list on the feature flag
   *           schema:
   *             type: object
   *             $ref: '#/definitions/FeatureFlagSegmentListInput'
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Feature flag exclusion list is updated
   */
  @Put('/exclusionList/:id')
  public async updateExclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @Body({ validate: true }) exclusionList: FeatureFlagListValidator,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentExclusion> {
    return this.featureFlagService.addList(exclusionList, 'exclusion', request.logger);
  }

  /**
   * @swagger
   * /flags/exclusionList:
   *    put:
   *       description: Update Feature Flag Inclusion List
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
   *           description: Updating an inclusion list on the feature flag
   *           schema:
   *             type: object
   *             $ref: '#/definitions/FeatureFlagSegmentListInput'
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Feature flag inclusion list is updated
   */
  @Put('/inclusionList/:id')
  public async updateInclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @Body({ validate: true }) inclusionList: FeatureFlagListValidator,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentInclusion> {
    return this.featureFlagService.addList(inclusionList, 'inclusion', request.logger);
  }

  /**
   * @swagger
   * /flags/inclusionList:
   *    delete:
   *       description: Delete Feature Flag Inclusion List
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
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete Feature Flag Inclusion List by segment Id
   */
  @Delete('/inclusionList/:id')
  public async deleteInclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.featureFlagService.deleteList(id, request.logger);
  }

  /**
   * @swagger
   * /flags/exclusionList:
   *    delete:
   *       description: Delete Feature Flag Exclusion List
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
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete Feature Flag Exclusion List by segment Id
   */
  @Delete('/exclusionList/:id')
  public async deleteExclusionList(
    @Params({ validate: true }) { id }: IdValidator,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.featureFlagService.deleteList(id, request.logger);
  }
}
