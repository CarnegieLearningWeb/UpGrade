import { JsonController, BodyParam, Get, Put, Delete, Param, Authorized } from 'routing-controllers';
import { ExperimentIncludeService } from '../services/ExperimentIncludeService';
import { ExplicitExperimentIndividualInclusion } from '../models/ExplicitExperimentIndividualInclusion';
import { ExplicitExperimentGroupInclusion } from '../models/ExplicitExperimentGroupInclusion';
import { SERVER_ERROR } from 'upgrade_types';

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
@JsonController('/experimentInclude')
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
  public getExperimentIncludedUser(): Promise<ExplicitExperimentIndividualInclusion[]> {
    return this.experimentInclude.getAllExperimentUser();
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
  @Put('/user')
  public experimentIncludeUser(@BodyParam('id') id: string): Promise<ExplicitExperimentIndividualInclusion> {
    return this.experimentInclude.experimentIncludeUser(id);
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
  @Delete('/user/:id')
  public delete(@Param('id') id: string): Promise<ExplicitExperimentIndividualInclusion | undefined> {
    if (!id) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : id should not be null.'));
    }
    return this.experimentInclude.deleteExperimentUser(id);
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
  public getExperimentIncludedGroups(): Promise<ExplicitExperimentGroupInclusion[]> {
    return this.experimentInclude.getAllExperimentGroups();
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
  @Put('/group')
  public experimentIncludeGroup(@BodyParam('type') type: string, @BodyParam('id') id: string): Promise<ExplicitExperimentGroupInclusion> {
    return this.experimentInclude.experimentIncludeGroup(id, type);
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
  @Delete('/group/:type/:id')
  public deleteExperimentGroup(
    @Param('id') id: string,
    @Param('type') type: string
  ): Promise<ExplicitExperimentGroupInclusion | undefined> {
    if (!id) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : id should not be null'));
    }
    if (!type) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : type should be provided for delete'));
    }
    return this.experimentInclude.deleteExperimentGroup(id, type);
  }
}
