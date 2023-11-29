import { JsonController, Req, Get, OnUndefined, Param, Post, Put, Body, Authorized } from 'routing-controllers';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { ExperimentUser } from '../models/ExperimentUser';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { SERVER_ERROR } from 'upgrade_types';
import { isUUID } from 'class-validator';
import { AppRequest } from '../../types';
import { ExperimentUserArrayValidator, ExperimentUserValidator } from './validators/ExperimentUserValidator';

// TODO delete this from experiment system
/**
 * @swagger
 * definitions:
 *   ExperimentUser:
 *     required:
 *       - id
 *     properties:
 *       id:
 *         type: string
 *       group:
 *         type: object
 *       workingGroup:
 *         type: object
 */

/**
 * @swagger
 * tags:
 *   - name: Experiment Users
 *     description: CRUD operations related to users
 */

@Authorized()
@JsonController('/experimentusers')
export class UserController {
  constructor(public userService: ExperimentUserService) {}

  /**
   * @swagger
   * /experimentusers:
   *    get:
   *       description: Get all the users
   *       tags:
   *         - Experiment Users
   *       responses:
   *          '200':
   *            description: Successful
   */
  @Get()
  public find(@Req() request: AppRequest): Promise<ExperimentUser[]> {
    return this.userService.find(request.logger);
  }

  /**
   * @swagger
   * /experimentusers/{id}:
   *    get:
   *       description: Get user by id
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: user Id
   *       tags:
   *         - Experiment Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get user By Id
   *          '404':
   *            description: user not found
   */
  @Get('/:id')
  @OnUndefined(UserNotFoundError)
  public one(@Param('id') id: string, @Req() request: AppRequest): Promise<ExperimentUser> {
    if (!isUUID(id)) {
      return Promise.reject(new Error(SERVER_ERROR.INCORRECT_PARAM_FORMAT + ' : id should be of type UUID.'));
    }
    return this.userService.findOne(id, request.logger);
  }

  /**
   * @swagger
   * /experimentusers:
   *    post:
   *       description: Create New ExperimentUser
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/ExperimentUser'
   *           description: ExperimentUser Structure
   *       tags:
   *         - Experiment Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New ExperimentUser is created
   */
  @Post()
  public create(
    @Body({ validate: true })
    users: ExperimentUserArrayValidator,
    @Req() request: AppRequest
  ): Promise<ExperimentUser[]> {
    return this.userService.create(users.users, request.logger);
  }

  /**
   * @swagger
   * /experimentusers/{id}:
   *    put:
   *       description: Update ExperimentUser
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: ExperimentUser ID
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/ExperimentUser'
   *           description: ExperimentUser Structure
   *       tags:
   *         - Experiment Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: ExperimentUser is updated
   */
  @Put('/:id')
  public update(
    @Param('id') id: string,
    @Body({ validate: true }) user: ExperimentUserValidator,
    @Req() request: AppRequest
  ): Promise<ExperimentUser> {
    return this.userService.update(id, user, request.logger);
  }
}
