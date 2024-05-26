import { JsonController, Authorized, Post, Body, CurrentUser, Delete, Param, Put, Req, Get } from 'routing-controllers';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { FeatureFlag } from '../models/FeatureFlag';
import { User } from '../models/User';
import { FeatureFlagStatusUpdateValidator } from './validators/FeatureFlagStatusUpdateValidator';
import { FeatureFlagPaginatedParamsValidator } from './validators/FeatureFlagsPaginatedParamsValidator';
import { AppRequest, PaginationResponse } from '../../types';
import { SERVER_ERROR } from 'upgrade_types';
import { FeatureFlagValidation, UserParamsValidator } from './validators/FeatureFlagValidator';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { isUUID } from 'class-validator';

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
 *       featureFlagSegmentInclusion:
 *          type: object
 *          properties:
 *              segment:
 *                type: object
 *                properties:
 *                  type:
 *                    type: string
 *                    example: private
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
 *       featureFlagSegmentExclusion:
 *          type: object
 *          properties:
 *              segment:
 *                type: object
 *                properties:
 *                  type:
 *                    type: string
 *                    example: private
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
 */

/**
 * @swagger
 * flags:
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
   * /flags:
   *    post:
   *       description: Get feature flags for user
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 example: user1
   *               context:
   *                 type: string
   *                 example: add
   *             description: User Document
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
  public findOne(@Param('id') id: string, @Req() request: AppRequest): Promise<FeatureFlag | undefined> {
    if (!isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
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
    return this.featureFlagService.create(flag, request.logger);
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
  public delete(@Param('id') id: string, @Req() request: AppRequest): Promise<FeatureFlag | undefined> {
    // TODO: Add server error
    // if (!isUUID(id)) {
    //   return Promise.reject(
    //     new Error(
    //       JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
    //     )
    //   );
    // }
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
    @Param('id') id: string,
    @Body({ validate: true })
    flag: FeatureFlagValidation,
    @CurrentUser() currentUser: User,
    @Req() request: AppRequest
  ): Promise<FeatureFlag> {
    // TODO: Add error log
    // if (!isUUID(id)) {
    //   return Promise.reject(
    //     new Error(
    //       JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
    //     )
    //   );
    // }
    return this.featureFlagService.update(flag, request.logger);
  }
}
