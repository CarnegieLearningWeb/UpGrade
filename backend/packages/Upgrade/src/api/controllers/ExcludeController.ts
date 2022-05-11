import { JsonController, BodyParam, Get, Delete, Param, Authorized, Post } from 'routing-controllers';
import { ExcludeService } from '../services/ExcludeService';
import { ExplicitIndividualExclusion } from '../models/ExplicitIndividualExclusion';
import { ExplicitGroupExclusion } from '../models/ExplicitGroupExclusion';
import { SERVER_ERROR } from 'upgrade_types';

/**
 * @swagger
 * definitions:
 *   userExcludeResponse:
 *     type: array
 *     description: ''
 *     minItems: 1
 *     uniqueItems: true
 *     items:
 *       type: object
 *       required:
 *         - createdAt
 *         - updatedAt
 *         - versionNumber
 *         - userId
 *       properties:
 *         createdAt:
 *           type: string
 *           minLength: 1
 *         updatedAt:
 *           type: string
 *           minLength: 1
 *         versionNumber:
 *           type: number
 *         userId:
 *           type: string
 *           minLength: 1
 *   groupExcludeResponse:
 *     type: array
 *     description: ''
 *     minItems: 1
 *     uniqueItems: true
 *     items:
 *       type: object
 *       required:
 *         - createdAt
 *         - updatedAt
 *         - versionNumber
 *         - groupId
 *         - type
 *       properties:
 *         createdAt:
 *           type: string
 *           minLength: 1
 *         updatedAt:
 *           type: string
 *           minLength: 1
 *         versionNumber:
 *           type: number
 *         groupId:
 *           type: string
 *           minLength: 1
 *         type:
 *           type: string
 *           minLength: 1
 */

/**
 * @swagger
 * tags:
 *   - name: Exclude
 *     description: To Exclude Users and Groups from experiments
 */
@Authorized()
@JsonController('/explicitExclude/global')
export class ExcludeController {
  constructor(public exclude: ExcludeService) {}

  /**
   * @swagger
   * /explicitExclude/global/user:
   *    get:
   *       description: Get all globally Excluded Users
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All globally Excluded Users
   *            schema:
   *              $ref: '#/definitions/userExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get('/user')
  public getExcludedUsers(): Promise<ExplicitIndividualExclusion[]> {
    return this.exclude.getAllUsers();
  }

  /**
   * @swagger
   * /explicitExclude/global/user:
   *    post:
   *       description: Exclude Users globally
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: body
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - userIds
   *             properties:
   *               userIds:
   *                type: array
   *                items:
   *                  type: string
   *           description: UserIds to exclude globally
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude users globally
   *            schema:
   *              $ref: '#/definitions/userExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, JSON format is not valid
   */
  @Post('/user')
  public excludeUsers(@BodyParam('userIds') userIds: Array<string>): Promise<ExplicitIndividualExclusion[]> {
    return this.exclude.excludeUsers(userIds);
  }

  /**
   * @swagger
   * /explicitExclude/global/user/{userId}:
   *    delete:
   *       description: Delete excluded user globally
   *       parameters:
   *         - in: path
   *           name: userId
   *           required: true
   *           schema:
   *             type: string
   *           description: User Id
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete globally excluded User By Id
   *            schema:
   *              $ref: '#/definitions/userExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error
   */
  @Delete('/user/:userId')
  public delete(@Param('userId') userId: string): Promise<ExplicitIndividualExclusion | undefined> {
    if (!userId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : id should not be null.'));
    }
    return this.exclude.deleteUser(userId);
  }

  /**
   * @swagger
   * /explicitExclude/global/group:
   *    get:
   *       description: Get all globally Excluded Groups
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All globally Excluded Groups
   *            schema:
   *              $ref: '#/definitions/groupExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get('/group')
  public getExcludedGroups(): Promise<ExplicitGroupExclusion[]> {
    return this.exclude.getAllGroups();
  }

  /**
   * @swagger
   * /explicitExclude/global/group:
   *    post:
   *       description: Exclude Groups globally
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: body
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - groups
   *             properties:
   *              groups:
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    groupId:
   *                      type: string
   *                    type:
   *                      type: string
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude groups globally
   *            schema:
   *              $ref: '#/definitions/groupExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, JSON format is not valid
   */
  @Post('/group')
  public excludeGroups(@BodyParam('groups') groups: Array<{ groupId: string, type: string }>): Promise<ExplicitGroupExclusion[]> {
    return this.exclude.excludeGroups(groups);
  }

  /**
   * @swagger
   * /explicitExclude/global/group/{type}/{id}:
   *    delete:
   *       description: Delete excluded group globally
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Group Id
   *         - in: path
   *           name: type
   *           required: true
   *           schema:
   *             type: string
   *           description: Group Type
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete globally excluded Group By groupId and type
   *            schema:
   *              $ref: '#/definitions/groupExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error
   */
  @Delete('/group/:type/:id')
  public deleteGroup(
    @Param('id') id: string,
    @Param('type') type: string
  ): Promise<ExplicitGroupExclusion | undefined> {
    if (!id) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : id should not be null'));
    }
    if (!type) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : type should be provided for delete'));
    }
    return this.exclude.deleteGroup(id, type);
  }
}
