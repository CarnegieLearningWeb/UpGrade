import { JsonController, BodyParam, Get, Delete, Param, Authorized, Post, OnUndefined, Req } from 'routing-controllers';
import { ExperimentIncludeService } from '../services/ExperimentIncludeService';
import { ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';
import { SERVER_ERROR } from 'upgrade_types';
import { isUUID } from 'class-validator';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { AppRequest } from '../../types';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
/**
 * @swagger
 * definitions:
 *   userExplicitExperimentIncludeResponse:
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
 *   groupExplicitExperimentIncludeResponse:
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
 *   segmentExplicitExperimentIncludeResponse:
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
 *   - name: ExplicitExperimentInclude
 *     description: To Include Users and Groups for experiments (Experiment level inclusions)
 */
@Authorized()
@JsonController('/explicitInclude/experiment')
export class ExperimentIncludeController {
  constructor(public experimentInclude: ExperimentIncludeService) {}

  /**
   * @swagger
   * /explicitInclude/experiment/user:
   *    get:
   *       description: Get all included users for an experiment
   *       tags:
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All included users for an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get('/user')
  public getExperimentIncludedUser( @Req() request: AppRequest ): Promise<ExplicitExperimentIndividualInclusion[]> {
    return this.experimentInclude.getAllExperimentUser(request.logger);
  }

  /**
   * @swagger
   * /explicitInclude/experiment/user/{userId}/{experimentId}:
   *    get:
   *       description: Get an included user for an experiment from userId and experimentId
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
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get an included user for an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '404':
   *            description: User not found, Experiment not found
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
   */
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
    if (!isUUID(experimentId)) {
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
   * /explicitInclude/experiment/user:
   *    post:
   *       description: Include users for an experiment
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
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Include users for an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, ExperimentId is not valid, JSON Format is not valid
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
   * /explicitInclude/experiment/user/{userId}/{experimentId}:
   *    delete:
   *       description: Delete included user from an experiment
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
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete included user from an experiment
   *            schema:
   *              $ref: '#/definitions/userExplicitExperimentIncludeResponse'
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
     ): Promise<ExplicitExperimentIndividualInclusion | undefined> {
     if (!userId) {
       return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : userId should not be null.'));
     }
     if (!experimentId) {
       return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : experimentId should not be null.'));
     }
     if (!isUUID(experimentId)) {
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
   * /explicitInclude/experiment/group:
   *    get:
   *       description: Get all included groups for an experiment
   *       tags:
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All included groups for an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get('/group')
  public getExperimentIncludedGroups( @Req() request: AppRequest ): Promise<ExplicitExperimentGroupInclusion[]> {
    return this.experimentInclude.getAllExperimentGroups(request.logger);
  }

  /**
   * @swagger
   * /explicitInclude/experiment/group/{type}/{id}/{experimentId}:
   *    get:
   *       description: Get a included group for an experiment from type, id and experimentId
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
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get a included group for an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '404':
   *            description: GroupType or GroupId not found, Experiment not found
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
   */
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
    if (!isUUID(experimentId)) {
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
   * /explicitInclude/experiment/group:
   *    post:
   *       description: Include groups from an experiment
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
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Include group from an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, ExperimentId is not valid, JSON Format is not valid
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
   * /explicitInclude/experiment/group/{type}/{id}/{experimentId}:
   *    delete:
   *       description: Delete included group from an experiment
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
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete included group from an experiment
   *            schema:
   *              $ref: '#/definitions/groupExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, ExperimentId is not valid
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
    if (!isUUID(experimentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentInclude.deleteExperimentGroup(id, type, experimentId, request.logger);
  }

/**
   * @swagger
   * /explicitInclude/experiment/segment:
   *    post:
   *       description: Include segment from an experiment
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
   *         - ExplicitExperimentInclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Include segment from an experiment
   *            schema:
   *              $ref: '#/definitions/segmentExplicitExperimentIncludeResponse'
   *          '401':
   *            description: Authorization Required Error
   *          '500':
   *            description: Internal Server Error, Insert Error in database, ExperimentId is not valid, JSON Format is not valid
   */
 @Post('/segment')
 public experimentIncludeSegment(
   @Req() request: AppRequest,
   @BodyParam('experimentId') experimentId: string,
   @BodyParam('segmentId') segmentId: string
 ): Promise<ExperimentSegmentInclusion> {
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
   return this.experimentInclude.experimentIncludeSegment(experimentId, segmentId, request.logger);
 }

 /**
  * @swagger
  * /explicitInclude/experiment/segment/{experimentId}/{segmentId}:
  *    delete:
  *       description: Delete included segment from an experiment
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
  *         - ExplicitExperimentInclude
  *       produces:
  *         - application/json
  *       responses:
  *          '200':
  *            description: Delete included segment from an experiment
  *            schema:
  *              $ref: '#/definitions/segmentExplicitExperimentIncludeResponse'
  *          '401':
  *            description: Authorization Required Error
  *          '500':
  *            description: Internal Server Error, ExperimentId is not valid
  */
 @Delete('/segment/:experimentId/:segmentId')
 public deleteExperimentIncludeSegment(
   @Req() request: AppRequest,
   @Param('experimentId') experimentId: string,
   @Param('segmentId') segmentId: string
 ): Promise<ExperimentSegmentInclusion | undefined> {  
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
   return this.experimentInclude.deleteExperimentSegment(experimentId, segmentId, request.logger);
 }
}
