import { JsonController, BodyParam, Get, Delete, Param, Authorized, Post, OnUndefined, Req } from 'routing-controllers';
import { ExperimentExcludeService } from '../services/ExperimentExcludeService';
import { ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import { SERVER_ERROR } from 'upgrade_types';
import { Validator } from 'class-validator';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { AppRequest } from '../../types';
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
@JsonController('/explicitExclude/experiment')
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
  public getExperimentExcludedUser( @Req() request: AppRequest ): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.experimentExclude.getAllExperimentUser(request.logger);
  }

  @Get('/user/:userId/:experimentId')
  @OnUndefined(UserNotFoundError)
  public getExperimentExcludedUserById(
    @Req() request: AppRequest,
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
    return this.experimentExclude.getExperimentUserById(userId, experimentId, request.logger);
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
    @Req() request: AppRequest,
    @BodyParam('userIds') userIds: Array<string>,
    @BodyParam('experimentId') experimentId: string,
  ): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.experimentExclude.experimentExcludeUser(userIds, experimentId, request.logger);
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
    @Req() request: AppRequest,
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
    return this.experimentExclude.deleteExperimentUser(userId, experimentId, request.logger);
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
  public getExperimentExcludedGroups( @Req() request: AppRequest ): Promise<ExplicitExperimentGroupExclusion[]> {
    return this.experimentExclude.getAllExperimentGroups(request.logger);
  }

  @Get('/group/:type/:id/:experimentId')
  public getExperimentExcludedGroupById(
    @Req() request: AppRequest,
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
    return this.experimentExclude.getExperimentGroupById(type, groupId, experimentId, request.logger);
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
    @Req() request: AppRequest,
    @BodyParam('groups') groups: Array<{ groupId: string, type: string }>,
    @BodyParam('experimentId') experimentId: string    
    ): Promise<ExplicitExperimentGroupExclusion[]> {
      console.log(' point 1');
    return this.experimentExclude.experimentExcludeGroup(groups, experimentId, request.logger);
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
    @Req() request: AppRequest,
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
    return this.experimentExclude.deleteExperimentGroup(id, type, experimentId, request.logger);
  }
}
