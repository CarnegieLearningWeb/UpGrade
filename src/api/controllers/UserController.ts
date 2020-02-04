import { JsonController, Post, Body } from 'routing-controllers';
import { User } from '../models/User';
import { UserService } from '../services/UserService';

/**
 * @swagger
 * definitions:
 *   User:
 *     required:
 *       - email
 *       - firstName
 *       - lastName
 *       - imageUrl
 *     properties:
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
  constructor(public userService: UserService) {}

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
    return this.userService.create(user);
  }
}
