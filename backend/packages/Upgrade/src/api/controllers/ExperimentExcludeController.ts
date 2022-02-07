import { JsonController, BodyParam, Get, Put, Delete, Param, Authorized } from 'routing-controllers';
import { ExperimentExcludeService } from '../services/ExperimentExcludeService';
import { ExplicitExperimentIndividualExclusion } from '../models/ExplicitExperimentIndividualExclusion';
import { ExplicitExperimentGroupExclusion } from '../models/ExplicitExperimentGroupExclusion';
import { SERVER_ERROR } from 'upgrade_types';

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
  @Put('/user')
  public experimentExcludeUser(@BodyParam('id') id: string): Promise<ExplicitExperimentIndividualExclusion> {
    return this.experimentExclude.experimentExcludeUser(id);
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
  @Delete('/user/:id')
  public delete(@Param('id') id: string): Promise<ExplicitExperimentIndividualExclusion | undefined> {
    if (!id) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : id should not be null.'));
    }
    return this.experimentExclude.deleteExperimentUser(id);
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
  @Put('/group')
  public experimentExcludeGroup(@BodyParam('type') type: string, @BodyParam('id') id: string): Promise<ExplicitExperimentGroupExclusion> {
    return this.experimentExclude.experimentExcludeGroup(id, type);
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
  @Delete('/group/:type/:id')
  public deleteExperimentGroup(
    @Param('id') id: string,
    @Param('type') type: string
  ): Promise<ExplicitExperimentGroupExclusion | undefined> {
    if (!id) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : id should not be null'));
    }
    if (!type) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : type should be provided for delete'));
    }
    return this.experimentExclude.deleteExperimentGroup(id, type);
  }
}
