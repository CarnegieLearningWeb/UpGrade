import { JsonController, Authorized, Post, Body, CurrentUser, Delete, Param, Put, Req } from 'routing-controllers';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { FeatureFlag } from '../models/FeatureFlag';
import { User } from '../models/User';
import { FeatureFlagStatusUpdateValidator } from './validators/FeatureFlagStatusUpdateValidator';
import { FeatureFlagPaginatedParamsValidator } from './validators/FeatureFlagsPaginatedParamsValidator';
import { AppRequest, PaginationResponse } from '../../types';
import { SERVER_ERROR } from 'upgrade_types';
import { FeatureFlagValidation } from './validators/FeatureFlagValidator';

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
 *       - variationType
 *       - status
 *       - variations
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 *       key:
 *         type: string
 *       description:
 *         type: string
 *       variationType:
 *         type: string
 *       status:
 *         type: boolean
 *       variations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                type: string
 *               name:
 *                type: string
 *               description:
 *                type: string
 *               defaultVariation:
 *                type: boolean[]
 */

/**
 * @swagger
 * flags:
 *   - name: Feature flags
 *     description: Get Feature flags related data
 */

@Authorized()
@JsonController('/flags')
export class FeatureFlagsController {
  constructor(public featureFlagService: FeatureFlagService) {}

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
   *                    enum: [all, name, key, status, variation Type]
   *                  string:
   *                    type: string
   *               sortParams:
   *                  type: object
   *                  properties:
   *                    key:
   *                     type: string
   *                     enum: [name, key, status, variationType]
   *                    sortAs:
   *                     type: string
   *                     enum: [ASC, DESC]
   *       tags:
   *         - Feature flags
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Paginated Experiments
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
   *         - Feature flags
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
   *           name: flagId
   *           required: true
   *           schema:
   *             type: string
   *           description: Flag ID
   *         - in: body
   *           name: status
   *           required: true
   *           schema:
   *             type: boolean
   *           description: Flag State
   *       tags:
   *         - Feature flags
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
   *         - Feature flags
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
   *         - Feature flags
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
