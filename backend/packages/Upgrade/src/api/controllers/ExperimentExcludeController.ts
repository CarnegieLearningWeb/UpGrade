import { JsonController, BodyParam, Get, Delete, Param, Authorized, Post } from 'routing-controllers';
import { ExperimentExcludeService } from '../services/ExperimentExcludeService';
import { ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import { SERVER_ERROR } from 'upgrade_types';
import { Validator } from 'class-validator';
const validator  = new Validator();

/**
 * @swagger
 * definitions:
 *   userExperimentExcludeResponse:
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
 *   groupExperimentExclude:
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
 *         - id
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
 *         id:
 *           type: string
 *           minLength: 1
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
 *   - name: ExperimentExclude
 *     description: To Exclude Users and Groups from experiments (Experiment level exclusions)
 */
@Authorized()
@JsonController('/experimentExclude')
export class ExperimentExcludeController {
  constructor(public experimentExclude: ExperimentExcludeService) {}

  /**
   * @swagger
   * /experimentExclude/user:
   *    get:
   *       description: Get all Excluded Users for an experiment
   *       tags:
   *         - ExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All Excluded Users for an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentExcludeResponse'
   */
  @Get('/user')
  public getExperimentExcludedUser(): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.experimentExclude.getAllExperimentUser();
  }

  @Get('/user/:userId/:experimentId')
  public getExperimentExcludedUserById(
    @Param('userId') userId: string,
    @Param('experimentId') experimentId: string
    ): Promise<ExplicitExperimentIndividualExclusion> {
    if (!userId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : userId should not be null.'));
    }
    if (!experimentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experiment should not be null.'));
    }
    if (!validator.isUUID(experimentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentExclude.getExperimentUserById(userId, experimentId);
  }

  /**
   * @swagger
   * /experimentExclude/user:
   *    put:
   *       description: Exclude an User from an experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: body
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - id
   *             properties:
   *               id:
   *                type: string
   *           description: UserId to exclude from an experiment
   *       tags:
   *         - ExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude user from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentExcludeResponse'
   */
  @Post('/user')
  public experimentExcludeUser(
    @BodyParam('userIds') userIds: Array<string>,
    @BodyParam('experimentId') experimentId: string,
  ): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.experimentExclude.experimentExcludeUser(userIds, experimentId);
  }

  /**
   * @swagger
   * /experimentExclude/user/{id}:
   *    delete:
   *       description: Delete excluded user from an experiment
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: User Id
   *       tags:
   *         - ExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete User By Id from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentExcludeResponse'
   */
  @Delete('/user/:userId/:experimentId')
  public delete(
    @Param('userId') userId: string,
    @Param('experimentId') experimentId: string
    ): Promise<ExplicitExperimentIndividualExclusion | undefined> {
    if (!userId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : userId should not be null.'));
    }
    if (!experimentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experimentId should be provided for delete.'));
    }
    if (!validator.isUUID(experimentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentExclude.deleteExperimentUser(userId, experimentId);
  }

  /**
   * @swagger
   * /experimentExclude/group:
   *    get:
   *       description: Get all Excluded Groups for an experiment
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All Excluded Groups for an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentExcludeResponse'
   */
  @Get('/group')
  public getExperimentExcludedGroups(): Promise<ExplicitExperimentGroupExclusion[]> {
    return this.experimentExclude.getAllExperimentGroups();
  }

  @Get('/group/:type/:id/:experimentId')
  public getExperimentExcludedGroupById(
    @Param('type') type: string,
    @Param('id') groupId: string,
    @Param('experimentId') experimentId: string
    ): Promise<ExplicitExperimentGroupExclusion> {
    if (!type) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : type should not be null.'));
    }
    if (!groupId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : groupId should not be null.'));
    }
    if (!experimentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experiment should not be null.'));
    }
    if (!validator.isUUID(experimentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentExclude.getExperimentGroupById(type, groupId, experimentId);
  }

  /**
   * @swagger
   * /experimentExclude/group:
   *    put:
   *       description: Exclude a Group from an experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: body
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - id
   *               - type
   *             properties:
   *               id:
   *                type: string
   *               type:
   *                type: string
   *       tags:
   *         - ExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude group from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentExcludeResponse'
   */
  @Post('/group')
  public experimentExcludeGroup(
    @BodyParam('groups') groups: Array<{ groupId: string, type: string }>,
    @BodyParam('experimentId') experimentId: string    
    ): Promise<ExplicitExperimentGroupExclusion[]> {
      console.log(' point 1');
    return this.experimentExclude.experimentExcludeGroup(groups, experimentId);
  }

  /**
   * @swagger
   * /experimentExclude/group/{type}/{id}:
   *    delete:
   *       description: Delete excluded user from an experiment
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
   *           description: Group Id
   *       tags:
   *         - ExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete User By Id from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentExcludeResponse'
   */
  @Delete('/group/:type/:id/:experimentId')
  public deleteExperimentGroup(
    @Param('type') type: string,
    @Param('id') id: string,
    @Param('experimentId') experimentId: string,
  ): Promise<ExplicitExperimentGroupExclusion | undefined> {
    if (!type) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : type should be provided for delete'));
    }
    if (!id) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : id should not be null'));
    }
    if (!experimentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experimentId should be provided for delete'));
    }
    if (!validator.isUUID(experimentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentExclude.deleteExperimentGroup(id, type, experimentId);
  }
}
