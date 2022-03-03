import { JsonController, BodyParam, Get, Delete, Param, Authorized, Post, OnUndefined, Req } from 'routing-controllers';
import { ExperimentIncludeService } from '../services/ExperimentIncludeService';
import { ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';
import { SERVER_ERROR } from 'upgrade_types';
import { Validator } from 'class-validator';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { AppRequest } from '../../types';
const validator = new Validator();

/**
 * @swagger
 * definitions:
 *   userExperimentIncludeResponse:
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
 *   groupExperimentInclude:
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
 *   - name: ExperimentInclude
 *     description: To Include Users and Groups from experiments (Experiment level inclusions)
 */
@Authorized()
@JsonController('/explicitInclude/experiment')
export class ExperimentIncludeController {
  constructor(public experimentInclude: ExperimentIncludeService) {}

  /**
   * @swagger
   * /experimentInclude/user:
   *    get:
   *       description: Get all Included Users for an experiment
   *       tags:
   *         - ExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All Included Users for an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentIncludeResponse'
   */
  @Get('/user')
  public getExperimentIncludedUser( @Req() request: AppRequest ): Promise<ExplicitExperimentIndividualInclusion[]> {
    return this.experimentInclude.getAllExperimentUser(request.logger);
  }

  @Get('/user/:userId/:experimentId')
  @OnUndefined(UserNotFoundError)
  public getExperimentIncludedUserById(
    @Req() request: AppRequest,
    @Param('userId') userId: string,
    @Param('experimentId') experimentId: string
    ): Promise<ExplicitExperimentIndividualInclusion> {
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
    return this.experimentInclude.getExperimentUserById(userId, experimentId, request.logger);
  }

  /**
   * @swagger
   * /experimentInclude/user:
   *    put:
   *       description: Include an User from an experiment
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
   *           description: UserId to include from an experiment
   *       tags:
   *         - ExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Include user from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentIncludeResponse'
   */
   @Post('/user')
   public experimentIncludeUser(
     @Req() request: AppRequest,
     @BodyParam('userIds') userIds: Array<string>,
     @BodyParam('experimentId') experimentId: string,
   ): Promise<ExplicitExperimentIndividualInclusion[]> {
     return this.experimentInclude.experimentIncludeUser(userIds, experimentId, request.logger);
   }

  /**
   * @swagger
   * /experimentInclude/user/{id}:
   *    delete:
   *       description: Delete included user from an experiment
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: User Id
   *       tags:
   *         - ExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete User By Id from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentIncludeResponse'
   */
   @Delete('/user/:userId/:experimentId')
   public delete(
     @Req() request: AppRequest,
     @Param('userId') userId: string,
     @Param('experimentId') experimentId: string
     ): Promise<ExplicitExperimentIndividualInclusion | undefined> {
     if (!userId) {
       return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : userId should not be null.'));
     }
     if (!experimentId) {
       return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experimentId should not be null.'));
     }
     if (!validator.isUUID(experimentId)) {
       return Promise.reject(
         new Error(
           JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
         )
       );
     }
     return this.experimentInclude.deleteExperimentUser(userId, experimentId, request.logger);
   }

  /**
   * @swagger
   * /experimentInclude/group:
   *    get:
   *       description: Get all Included Groups for an experiment
   *       tags:
   *         - Include
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All Included Groups for an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentIncludeResponse'
   */
  @Get('/group')
  public getExperimentIncludedGroups( @Req() request: AppRequest ): Promise<ExplicitExperimentGroupInclusion[]> {
    return this.experimentInclude.getAllExperimentGroups(request.logger);
  }

  @Get('/group/:type/:id/:experimentId')
  public getExperimentIncludedGroupById(
    @Req() request: AppRequest,
    @Param('type') type: string,
    @Param('id') groupId: string,
    @Param('experimentId') experimentId: string
    ): Promise<ExplicitExperimentGroupInclusion> {
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
    return this.experimentInclude.getExperimentGroupById(type, groupId, experimentId, request.logger);
  }

  /**
   * @swagger
   * /experimentInclude/group:
   *    put:
   *       description: Include a Group from an experiment
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
   *         - ExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Include group from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentIncludeResponse'
   */
   @Post('/group')
   public experimentIncludeGroup(
     @Req() request: AppRequest,
     @BodyParam('groups') groups: Array<{ groupId: string, type: string }>,
     @BodyParam('experimentId') experimentId: string    
    ): Promise<ExplicitExperimentGroupInclusion[]> {
      return this.experimentInclude.experimentIncludeGroup(groups, experimentId, request.logger);
   }

  /**
   * @swagger
   * /experimentInclude/group/{type}/{id}:
   *    delete:
   *       description: Delete included user from an experiment
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
   *         - ExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete User By Id from an experiment
   *            schema:
   *              $ref: '#/definitions/userExperimentIncludeResponse'
   */
  @Delete('/group/:type/:id/:experimentId')
  public deleteExperimentGroup(
    @Req() request: AppRequest,
    @Param('id') id: string,
    @Param('type') type: string,
    @Param('experimentId') experimentId: string
  ): Promise<ExplicitExperimentGroupInclusion | undefined> {
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
    return this.experimentInclude.deleteExperimentGroup(id, type, experimentId, request.logger);
  }
}
