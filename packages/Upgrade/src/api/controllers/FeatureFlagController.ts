import { JsonController, Get, Authorized, Post, Body, CurrentUser, Delete, Param, Put } from 'routing-controllers';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { FeatureFlag } from '../models/FeatureFlag';
import { User } from '../models/User';
import { FeatureFlagStatusUpdateValidator } from './validators/FeatureFlagStatusUpdateValidator';

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
  constructor(public featureFlagService: FeatureFlagService) { }

  /**
   * @swagger
   * /flags:
   *    get:
   *       description: Get all feature flags
   *       produces:
   *         - application/json
   *       tags:
   *         - Feature flags
   *       responses:
   *          '200':
   *            description: Feature flags list
   */
  @Get()
  public getAllFlags(): Promise<FeatureFlag[]> {
    return this.featureFlagService.find();
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
    @Body({ validate: { validationError: { target: false, value: false } } }) flag: FeatureFlag,
    @CurrentUser() currentUser: User
  ): Promise<FeatureFlag> {
    return this.featureFlagService.create(flag, currentUser);
  }

  /**
   * @swagger
   * /flags/state:
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
    @Body({ validate: { validationError: { target: false, value: false } } })
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
  public delete(@Param('id') id: string, @CurrentUser() currentUser: User): Promise<FeatureFlag | undefined> {
    // TODO: Add server error
    // if (!validator.isUUID(id)) {
    //   return Promise.reject(
    //     new Error(
    //       JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
    //     )
    //   );
    // }
    return this.featureFlagService.delete(id, currentUser);
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
    @Body({ validate: { validationError: { target: false, value: false }, skipMissingProperties: true } })
    flag: FeatureFlag,
    @CurrentUser() currentUser: User
  ): Promise<FeatureFlag> {
    // TODO: Add error log
    // if (!validator.isUUID(id)) {
    //   return Promise.reject(
    //     new Error(
    //       JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
    //     )
    //   );
    // }
    return this.featureFlagService.update(id, flag, currentUser);
  }
}
