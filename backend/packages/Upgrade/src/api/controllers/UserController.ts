import { JsonController, Post, Body, Get, Param } from 'routing-controllers';
import { User } from '../models/User';
import { UserService } from '../services/UserService';
import { UserRoleValidator } from './validators/UserRoleValidator';
import { UserPaginatedParamsValidator } from './validators/UserPaginatedParamsValidator';
import { SERVER_ERROR } from 'upgrade_types';
import { PaginationResponse } from '../../types';

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

@JsonController('/users')
export class UserController {
  constructor(public userService: UserService) { }

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
    @Body({ validate: { validationError: { target: true, value: true } } }) paginatedParams: UserPaginatedParamsValidator
  ): Promise<UserPaginationInfo> {
    if (!paginatedParams) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.MISSING_PARAMS, message: ' : paginatedParams should not be null.' })
        )
      );
    }

    const [users, count] = await Promise.all([
      this.userService.findPaginated(
        paginatedParams.skip,
        paginatedParams.take,
        paginatedParams.searchParams,
        paginatedParams.sortParams
      ),
      this.userService.getTotalCount(),
    ]);
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
  public getUserByEmail(@Param('email') email: string): Promise<User[]> {
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
  public create(@Body() user: User): Promise<User> {
    return this.userService.upsertUser(user);
  }

  /**
   * @swagger
   * /users/role:
   *   post:
   *     description: Update User role
   *     consumes:
   *       - application/json
   *     parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - role
   *             properties:
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
   *           description: User role is updated
   */
  @Post('/role')
  public updateRole(
    @Body({ validate: { validationError: { target: false, value: false } } })
    user: UserRoleValidator
  ): Promise<User> {
    return this.userService.updateUserRole(user.email, user.role);
  }
}
