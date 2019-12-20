import { JsonController, Get, OnUndefined, Param, Post, Put, Body } from 'routing-controllers';
import { UserService } from '../services/UserService';
import { User } from '../models/User';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { SERVER_ERROR } from 'ees_types';

/**
 * @swagger
 * definitions:
 *   User:
 *     required:
 *       - id
 *       - group
 *     properties:
 *       id:
 *         type: string
 *       group:
 *         type: object
 */

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: CRUD operations related to users
 */

@JsonController('/users')
export class UserController {
  constructor(public userService: UserService) {}

  /**
   * @swagger
   * /users:
   *    get:
   *       description: Get all the users
   *       tags:
   *         - Users
   *       responses:
   *          '200':
   *            description: Successful
   */
  @Get()
  public find(): Promise<User[]> {
    return this.userService.find();
  }

  /**
   * @swagger
   * /users/{id}:
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
   *         - Users
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
  public one(@Param('id') id: string): Promise<User> {
    if (!validator.isUUID(id)) {
      return Promise.reject(new Error(SERVER_ERROR.INCORRECT_PARAM_FORMAT + ' : id shoud be of type UUID.'));
    }
    return this.userService.findOne(id);
  }

  /**
   * @swagger
   * /users:
   *    post:
   *       description: Create New User
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/User'
   *           description: User Structure
   *       tags:
   *         - Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New User is created
   */
  @Post()
  public create(@Body() users: User[]): Promise<User[]> {
    return this.userService.create(users);
  }

  /**
   * @swagger
   * /users/{id}:
   *    put:
   *       description: Update User
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: User ID
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/User'
   *           description: User Structure
   *       tags:
   *         - Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: User is updated
   */
  @Put('/:id')
  public update(@Param('id') id: string, @Body() user: User): Promise<User> {
    return this.userService.update(id, user);
  }
}
