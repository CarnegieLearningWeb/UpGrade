import { JsonController, Post, Get, Body, Authorized, Req } from 'routing-controllers';
import { AppRequest } from '../../types';
import { User } from '../models/User';
import { UserDTO } from '../DTO/UserDTO';
import { UserService } from '../services/UserService';
import { env } from '../../env';
import { devUserDoc } from '../../init/seed/systemUser';

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

@JsonController('/login')
export class LoginController {
  constructor(public userService: UserService) {}

  /**
   * @swagger
   * /login/check-auth:
   *    get:
   *       description: Check whether Google auth is required. Returns devUser when auth is disabled.
   *       tags:
   *         - Login
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Auth config and optional dev user
   */
  @Get('/check-auth')
  public async checkAuth(): Promise<{ googleAuthRequired: boolean; devUser?: User }> {
    const googleAuthRequired = env.google.authTokenRequired;
    if (googleAuthRequired) {
      return { googleAuthRequired };
    }
    const users = await this.userService.getUserByEmail(devUserDoc.email);
    return { googleAuthRequired, devUser: users[0] };
  }

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
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   */
  @Authorized()
  @Post('/user')
  public upsertUser(@Body({ validate: true }) user: UserDTO, @Req() request: AppRequest): Promise<User> {
    if (user.role) {
      // Create a user with default role reader if user doesn't exist as anyone with accepted google account domain can login
      // Role can be updated later by admin users only
      delete user.role;
    }
    return this.userService.upsertUser(user, request.logger);
  }
}
