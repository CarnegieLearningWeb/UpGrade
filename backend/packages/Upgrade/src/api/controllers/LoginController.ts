import { JsonController, Post, Body, Authorized, Req } from 'routing-controllers';
import { AppRequest } from '../../types';
import { User } from '../models/User';
import { UserService } from '../services/UserService';
import { UserDetailsValidator } from './validators/UserDetailsValidator';

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
 *   - name: Login
 *     description: Login APIs
 */

@Authorized()
@JsonController('/login')
export class LoginController {
  constructor(public userService: UserService) {}

  /**
   * @swagger
   * /login/user:
   *    post:
   *       description: Create a new user if doesn't exist
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
   *         - Login
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: User will be created if doesn't exist in the DB
   */
  @Post('/user')
  public upsertUser(@Body({ validate: true }) user: UserDetailsValidator, @Req() request: AppRequest): Promise<User> {
    if (user.role) {
      // Create a user with default role reader if user doesn't exist as anyone with accepted google account domain can login
      // Role can be updated later by admin users only
      delete user.role;
    }
    return this.userService.upsertUser(user, request.logger);
  }
}
