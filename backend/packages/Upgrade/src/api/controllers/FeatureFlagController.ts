import {
  JsonController,
  Authorized,
  Post,
  Body,
  Delete,
  Put,
  Req,
  Get,
  Params,
  Patch,
  Res,
  CurrentUser,
} from 'routing-controllers';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { FeatureFlag } from '../models/FeatureFlag';
import { FeatureFlagSegmentExclusion } from '../models/FeatureFlagSegmentExclusion';
import { FeatureFlagSegmentInclusion } from '../models/FeatureFlagSegmentInclusion';
import { FeatureFlagStatusUpdateValidator } from './validators/FeatureFlagStatusUpdateValidator';
import { FeatureFlagFilterModeUpdateValidator } from './validators/FeatureFlagFilterModeUpdateValidator';
import { FeatureFlagPaginatedParamsValidator } from './validators/FeatureFlagsPaginatedParamsValidator';
import { AppRequest, PaginationResponse } from '../../types';
import { FEATURE_FLAG_LIST_FILTER_MODE, SERVER_ERROR } from 'upgrade_types';
import { FeatureFlagValidation, IdValidator } from './validators/FeatureFlagValidator';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { FeatureFlagListValidator } from '../controllers/validators/FeatureFlagListValidator';
import { Segment } from 'src/api/models/Segment';
import { Response } from 'express';
import { User } from '../models/User';

interface FeatureFlagsPaginationInfo extends PaginationResponse {
  nodes: FeatureFlag[];
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
 *       - filterMode
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
 *       filterMode:
 *        type: string
 *        enum: [includeAll, excludeAll]
 *   FeatureFlagInclusionExclusionList:
 *     required:
 *      - name
 *      - context
 *      - type
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlag> {
    return this.featureFlagService.create(flag, currentUser, request.logger);
  }

  /**
   * @swagger
   * /flags/status:
   *    patch:
   *       description: Update Feature flag State
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: statusUpdate
   *           description: Updating the feature flag's status
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
  @Patch('/status')
  public async updateState(
    @Body({ validate: true })
    flag: FeatureFlagStatusUpdateValidator,
    @CurrentUser() currentUser: User
  ): Promise<FeatureFlag> {
    return this.featureFlagService.updateState(flag.flagId, flag.status, currentUser);
  }

  /**
   * @swagger
   * /flags/filterMode:
   *    patch:
   *       description: Update Feature flag Filter Mode
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: updateFilterMode
   *           description: Updating the feature flag's filter mode
   *           schema:
   *             type: object
   *             required:
   *              - flagId
   *              - filterMode
   *             properties:
   *              flagId:
   *                type: string
   *              filterMode:
   *                type: string
   *                enum: [includeAll, excludeAll]
   *       tags:
   *         - Feature Flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Feature flag filterMode is updated
   */
  @Patch('/filterMode')
  public async updateFilterMode(
    @Body({ validate: true })
    flag: FeatureFlagFilterModeUpdateValidator,
    @CurrentUser() currentUser: User
  ): Promise<FeatureFlag> {
    return this.featureFlagService.updateFilterMode(flag.flagId, flag.filterMode, currentUser);
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlag | undefined> {
    return this.featureFlagService.delete(id, currentUser, request.logger);
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlag> {
    return this.featureFlagService.update(flag, currentUser, request.logger);
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
   *           name: addInclusionList
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentInclusion> {
    return this.featureFlagService.addList(
      inclusionList,
      FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION,
      currentUser,
      request.logger
    );
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentExclusion> {
    return this.featureFlagService.addList(
      exclusionList,
      FEATURE_FLAG_LIST_FILTER_MODE.EXCLUSION,
      currentUser,
      request.logger
    );
  }

  /**
   * @swagger
   * /flags/exclusionList:
   *    put:
   *       description: Update Feature Flag Exclusion List
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentExclusion> {
    if (id !== exclusionList.list.id) {
      return Promise.reject(
        new Error(
          `${SERVER_ERROR.INCORRECT_PARAM_FORMAT}: The id in the URL (${id}) does not match the list id in the request body (${exclusionList.list.id}).`
        )
      );
    }
    return this.featureFlagService.updateList(
      exclusionList,
      FEATURE_FLAG_LIST_FILTER_MODE.EXCLUSION,
      currentUser,
      request.logger
    );
  }

  /**
   * @swagger
   * /flags/inclusionList:
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlagSegmentInclusion> {
    if (id !== inclusionList.list.id) {
      return Promise.reject(
        new Error(
          `${SERVER_ERROR.INCORRECT_PARAM_FORMAT}: The id in the URL (${id}) does not match the list id in the request body (${inclusionList.list.id}).`
        )
      );
    }
    return this.featureFlagService.updateList(
      inclusionList,
      FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION,
      currentUser,
      request.logger
    );
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.featureFlagService.deleteList(id, FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION, currentUser, request.logger);
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
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<Segment> {
    return this.featureFlagService.deleteList(id, FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION, currentUser, request.logger);
  }

  /**
   * @swagger
   * /flags/export/{id}:
   *    get:
   *      description: Export Feature Flags JSON
   *      tags:
   *        - Feature Flags
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          flagId: Id
   *          description: Feature Flag Id
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Get Feature Flag JSON
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Feature Flag Id not found
   *        '500':
   *          description: Internal Server Error
   */
  @Get('/export/:id')
  public async exportFeatureFlag(
    @Params({ validate: true }) { id }: IdValidator,
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest,
    @Res() response: Response
  ): Promise<Response> {
    const featureFlag = await this.featureFlagService.exportDesign(id, currentUser, request.logger);
    // download JSON file with appropriate headers to response body;
    response.setHeader('Content-Disposition', `attachment; filename="${featureFlag.name}.json"`);
    response.setHeader('Content-Type', 'application/json');
    const plainFeatureFlag = JSON.stringify(featureFlag, null, 2); // Convert to JSON string
    return response.send(plainFeatureFlag);
  }
}
