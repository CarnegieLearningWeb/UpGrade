import { JsonController, Post, Body, Get, Authorized, Delete, Req, Params } from 'routing-controllers';
import { User } from '../models/User';
import { UserService } from '../services/UserService';
import { UserDTO } from '../DTO/UserDTO';
import { EmailValidator, UserPaginatedParamsValidator } from './validators/UserPaginatedParamsValidator';
import { AppRequest, PaginationResponse } from '../../types';

interface UserPaginationInfo extends PaginationResponse {
  nodes: User[];
}

/**
 * @swagger
 * definitions:
 *   User:
 *     required:
 *       - id
 *       - email
 *     properties:
 *       id:
 *         type: string
 *       email:
 *         type: string
 *       firstName:
 *         type: string
 *       lastName:
 *         type: string
 *       imageUrl:
 *         type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: System Users
 */

@Authorized()
@JsonController('/users')
export class UserController {
  constructor(public userService: UserService) {}

  /**
   * @swagger
   * /users/paginated:
   *    post:
   *       description: Get Paginated Users
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - skip
   *               - take
   *             properties:
   *               skip:
   *                type: integer
   *               take:
   *                type: integer
   *               searchParams:
   *                type: object
   *                properties:
   *                  key:
   *                    type: string
   *                    enum: [all, firstName, lastName, email, role]
   *                  string:
   *                    type: string
   *               sortParams:
   *                  type: object
   *                  properties:
   *                    key:
   *                     type: string
   *                     enum: [firstName, lastName, email, role]
   *                    sortAs:
   *                     type: string
   *                     enum: [ASC, DESC]
   *       tags:
   *         - Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Paginated Users
   */
  @Post('/paginated')
  public async paginatedFind(
    @Body({ validate: true })
    paginatedParams: UserPaginatedParamsValidator,
    @Req() request: AppRequest
  ): Promise<UserPaginationInfo> {
    const [users, count] = await this.userService.findPaginated(
      paginatedParams.skip,
      paginatedParams.take,
      request.logger,
      paginatedParams.searchParams,
      paginatedParams.sortParams
    );
    return {
      total: count,
      nodes: users,
      ...paginatedParams,
    };
  }

  /**
   * @swagger
   * /users/{email}:
   *    get:
   *       description: Get user by email
   *       parameters:
   *         - in: path
   *           name: email
   *           required: true
   *           schema:
   *             type: string
   *           description: User email
   *       tags:
   *         - Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get User By Email
   */
  @Get('/:email')
  public getUserByEmail(@Params({ validate: true }) { email }: EmailValidator): Promise<User[]> {
    return this.userService.getUserByEmail(email);
  }

  /**
   * @swagger
   * /users:
   *    post:
   *       description: Create New System User
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
  public create(@Body({ validate: true }) user: UserDTO, @Req() request: AppRequest): Promise<User> {
    return this.userService.upsertUser(user, request.logger);
  }

  /**
   * @swagger
   * /users/details:
   *   post:
   *     description: Update User Details
   *     consumes:
   *       - application/json
   *     parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - email
   *               - role
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [admin, creator, manager, reader]
   *     tags:
   *       - Users
   *     produces:
   *        - application/json
   *     responses:
   *         '200':
   *           description: User Details is updated
   */
  @Post('/details')
  public updateUserDetails(
    @Body({ validate: true })
    user: UserDTO
  ): Promise<User> {
    return this.userService.updateUserDetails(user.firstName, user.lastName, user.email, user.role);
  }

  /**
   * @swagger
   * /users/{email}:
   *    delete:
   *       description: Delete user
   *       parameters:
   *         - in: path
   *           name: email
   *           required: true
   *           schema:
   *             type: string
   *           description: Email id of user
   *       tags:
   *         - Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete User By email
   */
  @Delete('/:email')
  public delete(@Params({ validate: true }) { email }: EmailValidator): Promise<User> {
    return this.userService.deleteUser(email);
  }
}
