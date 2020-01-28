import { JsonController, BodyParam, Get, Put, Delete, Param } from 'routing-controllers';
import { ExcludeService } from '../services/ExcludeService';
import { ExplicitIndividualExclusion } from '../models/ExplicitIndividualExclusion';
import { ExplicitGroupExclusion } from '../models/ExplicitGroupExclusion';
import { SERVER_ERROR } from 'ees_types';

/**
 * @swagger
 * tags:
 *   - name: Exclude
 *     description: To Exclude Users and Groups from experiments
 */
@JsonController('/exclude')
export class ExcludeController {
  constructor(public exclude: ExcludeService) {}

  /**
   * @swagger
   * /exclude/user:
   *    get:
   *       description: Get all Excluded Users
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All Excluded Users
   */
  @Get('/user')
  public getExcludedUser(): Promise<ExplicitIndividualExclusion[]> {
    return this.exclude.getAllUser();
  }

  /**
   * @swagger
   * /exclude/user:
   *    put:
   *       description: Exclude an User
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: UserId to exclude
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude user from experiment
   */
  @Put('/user')
  public excludeUser(@BodyParam('id') id: string): Promise<ExplicitIndividualExclusion> {
    return this.exclude.excludeUser(id);
  }

  /**
   * @swagger
   * /exclude/{id}:
   *    delete:
   *       description: Delete excluded user
   *       parameters:
   *         - in: path
   *           name: id
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
   *            description: Delete User By Id
   */
  @Delete('/:id')
  public delete(@Param('id') id: string): Promise<ExplicitIndividualExclusion | undefined> {
    if (!validator.isUUID(id)) {
      return Promise.reject(new Error(SERVER_ERROR.INCORRECT_PARAM_FORMAT + ' : id should be of type UUID.'));
    }
    return this.exclude.deleteUser(id);
  }

  /**
   * @swagger
   * /exclude/group:
   *    get:
   *       description: Get all Excluded Groups
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: All Excluded Groups
   */
  @Get('/group')
  public getExcludedGroups(): Promise<ExplicitGroupExclusion[]> {
    return this.exclude.getAllGroups();
  }

  /**
   * @swagger
   * /exclude/group:
   *    put:
   *       description: Exclude a Group
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: type
   *           required: true
   *           schema:
   *             type: string
   *           description: Group type to exclude
   *         - in: body
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Group Id to exclude
   *       tags:
   *         - Exclude
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Exclude group from experiment
   */
  @Put('/group')
  public excludeGroup(@BodyParam('type') type: string, @BodyParam('id') id: string): Promise<ExplicitGroupExclusion> {
    return this.exclude.excludeGroup(id, type);
  }
}
