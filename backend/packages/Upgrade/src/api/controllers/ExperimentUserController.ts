import { JsonController, Req, Get, Post, Put, Body, Authorized, Params } from 'routing-controllers';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { ExperimentUser } from '../models/ExperimentUser';
import { AppRequest } from '../../types';
import {
  ExperimentUserArrayValidator,
  ExperimentUserValidator,
  IdValidator,
} from './validators/ExperimentUserValidator';
import { InsertResult } from 'typeorm';
import { ExperimentClientController } from './ExperimentClientController.v5';

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
  constructor(
    public userService: ExperimentUserService,
    public experimentClientController: ExperimentClientController
  ) {}

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
   *          '401':
   *            description: AuthorizationRequiredError
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
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   */
  @Get('/:id')
  public async one(
    @Params({ validate: true }) { id }: IdValidator,
    @Req() request: AppRequest
  ): Promise<ExperimentUser> {
    await this.experimentClientController.checkIfUserExist(id, request.logger);
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
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Post()
  public create(
    @Body({ validate: true })
    users: ExperimentUserArrayValidator,
    @Req() request: AppRequest
  ): Promise<InsertResult> {
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
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '404':
   *            description: Experiment User not defined
   */
  @Put('/:id')
  public async update(
    @Params({ validate: true }) { id }: IdValidator,
    @Body({ validate: true }) user: ExperimentUserValidator,
    @Req() request: AppRequest
  ): Promise<ExperimentUser> {
    await this.experimentClientController.checkIfUserExist(id, request.logger);
    return this.userService.update(id, user, request.logger);
  }
}
