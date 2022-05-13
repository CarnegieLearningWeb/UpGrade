import { JsonController, BodyParam, Get, Delete, Param, Authorized, Post, OnUndefined, Req } from 'routing-controllers';
import { ExperimentExcludeService } from '../services/ExperimentExcludeService';
import { ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import { SERVER_ERROR } from 'upgrade_types';
import { Validator } from 'class-validator';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { AppRequest } from '../../types';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';
const validator  = new Validator();

/**
 * @swagger
 * definitions:
 *   userExplicitExperimentExcludeResponse:
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
 *         - experimentId
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
 *         experimentId:
 *           type: string
 *           minLength: 1
 *   groupExplicitExperimentExcludeResponse:
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
 *         - type
 *         - id
 *         - experimentId
 *       properties:
 *         createdAt:
 *           type: string
 *           minLength: 1
 *         updatedAt:
 *           type: string
 *           minLength: 1
 *         versionNumber:
 *           type: number
 *         type:
 *           type: string
 *           minLength: 1
 *         id:
 *           type: string
 *           minLength: 1
 *         experimentId:
 *           type: string
 *           minLength: 1
 *   segmentExplicitExperimentExcludeResponse:
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
 *         - SegmentId
 *         - experimentId
 *       properties:
 *         createdAt:
 *           type: string
 *           minLength: 1
 *         updatedAt:
 *           type: string
 *           minLength: 1
 *         versionNumber:
 *           type: number
 *         segmentId:
 *           type: string
 *           minLength: 1
 *         experimentId:
 *           type: string
 *           minLength: 1
 */

/**
 * @swagger
 * tags:
 *   - name: ExplicitExperimentExclude
 *     description: To Exclude Users and Groups for experiments (Experiment level exclusions)
 */
@Authorized()
@JsonController('/explicitExclude/experiment')
export class ExperimentExcludeController {
  constructor(public experimentExclude: ExperimentExcludeService) {}

  /**
   * @swagger
   * /explicitExclude/experiment/user:
   *    get:
   *       description: Get all excluded Users for an experiment
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All excluded users for an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get('/user')
  public getExperimentExcludedUser( @Req() request: AppRequest ): Promise<ExplicitExperimentIndividualExclusion[]> {
    return this.experimentExclude.getAllExperimentUser(request.logger);
  }

  /**
   * @swagger
   * /explicitExclude/experiment/user/{userId}/{experimentId}:
   *    get:
   *       description: Get an excluded user for an experiment from userId and experimentId
   *       parameters:
   *        - in: path
   *          name: userId
   *          required: true
   *          schema:
   *            type: string
   *          description: User Id
   *        - in: path
   *          name: experimentId
   *          required: true
   *          schema:
   *            type: string
   *          description: Experiment Id
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get an excluded user for an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '404':
   *            description: User not found, Experiment not found
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
   */
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
   * /explicitExclude/experiment/user:
   *    post:
   *       description: Exclude users for an experiment
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
   *               - experimentId
   *             properties:
   *               userIds:
   *                type: array
   *                items:
   *                 type: string
   *               experimentId:
   *                type: string
   *           description: User Ids and experimentId
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude users for an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, ExperimentId is not valid, JSON Format is not valid
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
   * /explicitExclude/experiment/user/{userId}/{experimentId}:
   *    delete:
   *       description: Delete excluded user from an experiment
   *       parameters:
   *         - in: path
   *           name: userId
   *           required: true
   *           schema:
   *             type: string
   *           description: User Id
   *         - in: path
   *           name: experimentId
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete excluded user from an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
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
   * /explicitExclude/experiment/group:
   *    get:
   *       description: Get all excluded groups for an experiment
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All excluded groups for an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get('/group')
  public getExperimentExcludedGroups( @Req() request: AppRequest ): Promise<ExplicitExperimentGroupExclusion[]> {
    return this.experimentExclude.getAllExperimentGroups(request.logger);
  }

  /**
   * @swagger
   * /explicitExclude/experiment/group/{type}/{id}/{experimentId}:
   *    get:
   *       description: Get a excluded group for an experiment from type, id and experimentId
   *       parameters:
   *        - in: path
   *          name: type
   *          required: true
   *          schema:
   *            type: string
   *          description: Group type
   *        - in: path
   *          name: id
   *          required: true
   *          schema:
   *            type: string
   *          description: Group Id
   *        - in: path
   *          name: experimentId
   *          required: true
   *          schema:
   *            type: string
   *          description: Experiment Id
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get a excluded group for an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '404':
   *            description: GroupType or GroupId not found, Experiment not found
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
   */
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
   * /explicitExclude/experiment/group:
   *    post:
   *       description: Exclude groups from an experiment
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
   *               - experimentId
   *             properties:
   *              groups:
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    type:
   *                      type: string
   *                    groupId:
   *                      type: string
   *              experimentId:
   *                type: string
   *           description: Group types with group Ids and experimetId
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude group from an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, ExperimentId is not valid, JSON Format is not valid
   */
  @Post('/group')
  public experimentExcludeGroup(
    @Req() request: AppRequest,
    @BodyParam('groups') groups: Array<{ groupId: string, type: string }>,
    @BodyParam('experimentId') experimentId: string    
    ): Promise<ExplicitExperimentGroupExclusion[]> {
    return this.experimentExclude.experimentExcludeGroup(groups, experimentId, request.logger);
  }

  /**
   * @swagger
   * /explicitExclude/experiment/group/{type}/{id}/{experimentId}:
   *    delete:
   *       description: Delete excluded group from an experiment
   *       parameters:
   *         - in: path
   *           name: type
   *           required: true
   *           schema:
   *             type: string
   *           description: Group Type
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Group Id
   *         - in: path
   *           name: experimentId
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete excluded group from an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
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

  /**
   * @swagger
   * /explicitExclude/experiment/segment:
   *    post:
   *       description: Exclude segment from an experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: body
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - experimentId
   *               - segmentId
   *             properties:
   *              experimentId:
   *                type: string
   *              segmentId:
   *                type: string
   *           description: SegmentId and experimetId
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude segment from an experiment
   *            schema:
   *              $ref: '#/definitions/segmentExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, ExperimentId is not valid, JSON Format is not valid
   */
  @Post('/segment')
  public experimentExcludeSegment(
    @Req() request: AppRequest,
    @BodyParam('experimentId') experimentId: string,
    @BodyParam('segmentId') segmentId: string
  ): Promise<ExperimentSegmentExclusion> {
    if (!experimentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experimentId should not be null'));
    }
    if (!validator.isUUID(experimentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    if (!segmentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : segmentId should not be null'));
    }
    if (!validator.isUUID(segmentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentExclude.experimentExcludeSegment(experimentId, segmentId, request.logger);
  }

  /**
   * @swagger
   * /explicitExclude/experiment/segment/{experimentId}/{segmentId}:
   *    delete:
   *       description: Delete excluded segment from an experiment
   *       parameters:
   *         - in: path
   *           name: experimentId
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *         - in: path
   *           name: segmentId
   *           required: true
   *           schema:
   *             type: string
   *           description: Segment Id
   *       tags:
   *         - ExplicitExperimentExclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete excluded segment from an experiment
   *            schema:
   *              $ref: '#/definitions/segmentExplicitExperimentExcludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
   */
  @Delete('/segment/:experimentId/:segmentId')
  public deleteExperimentExcludeSegment(
    @Req() request: AppRequest,
    @Param('experimentId') experimentId: string,
    @Param('segmentId') segmentId: string
  ): Promise<ExperimentSegmentExclusion | undefined> {  
    if (!experimentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experimentId should not be null'));
    }
    if (!validator.isUUID(experimentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    if (!segmentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : segmentId should not be null'));
    }
    if (!validator.isUUID(segmentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentExclude.deleteExperimentSegment(experimentId, segmentId, request.logger);
  }
}
