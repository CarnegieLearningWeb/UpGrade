import { JsonController, Get, OnUndefined, Param, Post, Put, Body, Authorized, Delete, Req } from 'routing-controllers';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { SERVER_ERROR } from 'upgrade_types';
import { PreviewUserService } from '../services/PreviewUserService';
import { PreviewUser } from '../models/PreviewUser';
import { isString } from 'class-validator';
import { PaginatedParamsValidator } from './validators/PaginatedParamsValidator';
import { AppRequest, PaginationResponse } from '../../types';
import { PreviewUserValidator } from './validators/PreviewUserValidator';

interface PreviewUserPaginationInfo extends PaginationResponse {
  nodes: PreviewUser[];
}

/**
 * @swagger
 * definitions:
 *   PreviewUser:
 *     required:
 *       - id
 *     properties:
 *       id:
 *         type: string
 *       assignments:
 *          type: array
 *          items:
 *            properties:
 *              experiment:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *              experimentCondition:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Preview Users
 *     description: CRUD operations related to users
 */

@Authorized()
@JsonController('/previewusers')
export class PreviewUserController {
  constructor(public previewUserService: PreviewUserService) {}

  /**
   * @swagger
   * /previewusers/paginated:
   *    post:
   *       description: Get Paginated Preview Users
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
   *       tags:
   *         - Preview Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Paginated Preview Users
   */
  @Post('/paginated')
  public async paginatedFind(
    @Body({ validate: true }) paginatedParams: PaginatedParamsValidator,
    @Req() request: AppRequest
  ): Promise<PreviewUserPaginationInfo> {
    if (!paginatedParams) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.MISSING_PARAMS, message: ' : paginatedParams should not be null.' })
        )
      );
    }

    const [previewUsers, count] = await Promise.all([
      this.previewUserService.findPaginated(paginatedParams.skip, paginatedParams.take, request.logger),
      this.previewUserService.getTotalCount(request.logger),
    ]);
    return {
      total: count,
      nodes: previewUsers,
      ...paginatedParams,
    };
  }

  /**
   * @swagger
   * /previewusers/{id}:
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
   *         - Preview Users
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
  public one(@Param('id') id: string, @Req() request: AppRequest): Promise<PreviewUser | undefined> {
    if (!isString(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type string.' })
        )
      );
    }
    return this.previewUserService.findOne(id, request.logger);
  }

  /**
   * @swagger
   * /previewusers:
   *    post:
   *       description: Create New PreviewUser
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/PreviewUser'
   *           description: PreviewUser Structure
   *       tags:
   *         - Preview Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New ExperimentUser is created
   */
  @Post()
  public create(@Body({ validate: true }) users: PreviewUserValidator, @Req() request: AppRequest): Promise<PreviewUser> {
    return this.previewUserService.create(users, request.logger);
  }

  /**
   * @swagger
   * /previewusers/{id}:
   *    put:
   *       description: Update PreviewUser
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: PreviewUser ID
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/PreviewUser'
   *           description: PreviewUser Structure
   *       tags:
   *         - Preview Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: PreviewUser is updated
   */
  @Put('/:id')
  public update(
    @Param('id') id: string,
    @Body({ validate: true }) user: PreviewUserValidator,
    @Req() request: AppRequest
  ): Promise<PreviewUser> {
    return this.previewUserService.update(id, user, request.logger);
  }

  /**
   * @swagger
   * /previewusers/{id}:
   *    delete:
   *       description: Delete preview user
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Preview User Id
   *       tags:
   *         - Preview Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete User By Id
   */
  @Delete('/:id')
  public delete(@Param('id') id: string, @Req() request: AppRequest): Promise<PreviewUser | undefined> {
    return this.previewUserService.delete(id, request.logger);
  }

  /**
   * @swagger
   * /previewusers/assign:
   *    post:
   *       description: Create Assignments for Preview users
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: user
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/PreviewUser'
   *           description: PreviewUser Structure
   *       tags:
   *         - Preview Users
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Assignment is created
   */
  @Post('/assign')
  public assign(@Body({ validate: true }) user: PreviewUserValidator, @Req() request: AppRequest): Promise<PreviewUser> {
    return this.previewUserService.upsertExperimentConditionAssignment(user, request.logger);
  }
}
