import { Body, Get, JsonController, OnUndefined, Param, Post, Put, Delete } from 'routing-controllers';
import { Experiment } from '../models/Experiment';
import { ExperimentNotFoundError } from '../errors/ExperimentNotFoundError';
import { ExperimentService } from '../services/ExperimentService';
import { SERVER_ERROR } from 'ees_types';
import { Validator } from 'class-validator';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { PaginatedParamsValidator } from './validators/PaginatedParamsValidator';
const validator = new Validator();

interface ExperimentPaginationInfo {
  total: number;
  skip: number;
  take: number;
  nodes: Experiment[];
}

/**
 * @swagger
 * definitions:
 *   Experiment:
 *     required:
 *       - id
 *       - name
 *       - state
 *       - consistencyRule
 *       - assignmentUnit
 *       - postExperimentRule
 *       - enrollmentCompleteCondition
 *       - group
 *       - conditions
 *       - partitions
 *     properties:
 *       id:
 *         type: string
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       state:
 *         type: string
 *         enum: [inactive, demo, scheduled, enrolling, enrollmentComplete, cancelled]
 *       startOn:
 *          type: string
 *          format: date-time
 *       consistencyRule:
 *         type: string
 *         enum: [individual, experiment, group]
 *       assignmentUnit:
 *         type: string
 *         enum: [individual, group]
 *       postExperimentRule:
 *         type: string
 *         enum: [continue, revert]
 *       enrollmentCompleteCondition:
 *          type: object
 *          properties:
 *           userCount:
 *             type: integer
 *           groupCount:
 *             type: integer
 *       endOn:
 *          type: string
 *          format: date-time
 *       revertTo:
 *          type: string
 *       tags:
 *          type: array
 *          items:
 *            type: string
 *       group:
 *         type: string
 *       conditions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                type: string
 *               assignmentWeight:
 *                type: number
 *               description:
 *                type: string
 *       partitions:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             point:
 *               type: string
 *             name:
 *               type: string
 *             description:
 *               type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Experiments
 *     description: CRUD operations related to experiments
 */
@JsonController('/experiments')
export class ExperimentController {
  constructor(public experimentService: ExperimentService) {}
  /**
   * @swagger
   * /experiments:
   *    get:
   *       description: Get all the experiments
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment List
   */
  @Get()
  public find(): Promise<Experiment[]> {
    return this.experimentService.find();
  }

  /**
   * @swagger
   * /experiments/paginated:
   *    post:
   *       description: Get Paginated Experiment
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
   *                    enum: [all, name, status, tag]
   *                  string:
   *                    type: string
   *               sortParams:
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    key:
   *                     type: string
   *                     enum: [name, status, createdAt]
   *                    sortAs:
   *                     type: string
   *                     enum: [ASC, DESC]
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Paginated Experiments
   */
  @Post('/paginated')
  public async paginatedFind(
    @Body({ validate: { validationError: { target: false, value: false } } }) paginatedParams: PaginatedParamsValidator
  ): Promise<ExperimentPaginationInfo> {
    const [experiments, count] = await Promise.all([
      this.experimentService.findPaginated(
        paginatedParams.skip,
        paginatedParams.take,
        paginatedParams.searchParams,
        paginatedParams.sortParams
      ),
      this.experimentService.getTotalCount(),
    ]);
    return {
      total: count,
      nodes: experiments,
      ...paginatedParams,
    };
  }

  /**
   * @swagger
   * /experiments/{id}:
   *    get:
   *       description: Get experiment by id
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Experiment By Id
   *          '404':
   *            description: Experiment not found
   */
  @Get('/:id')
  @OnUndefined(ExperimentNotFoundError)
  public one(@Param('id') id: string): Promise<Experiment> | undefined {
    if (!validator.isUUID(id)) {
      return Promise.reject(new Error(SERVER_ERROR.INCORRECT_PARAM_FORMAT + ' : id should be of type UUID.'));
    }
    return this.experimentService.findOne(id);
  }

  /**
   * @swagger
   * /experiments/conditions/{id}:
   *    get:
   *       description: Get experiment conditions
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Experiment By Id
   *          '404':
   *            description: Experiment not found
   */
  @Get('/conditions/:id')
  @OnUndefined(ExperimentNotFoundError)
  public getCondition(@Param('id') id: string): Promise<ExperimentCondition[]> {
    if (!validator.isUUID(id)) {
      return Promise.reject(new Error(SERVER_ERROR.INCORRECT_PARAM_FORMAT + ' : id should be of type UUID.'));
    }
    return this.experimentService.getExperimentalConditions(id);
  }

  /**
   * @swagger
   * /experiments:
   *    post:
   *       description: Create New Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experiment
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/Experiment'
   *           description: Experiment Structure
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: New Experiment is created
   */

  @Post()
  public create(
    @Body({ validate: { validationError: { target: false, value: false } } }) experiment: Experiment
  ): Promise<Experiment> {
    return this.experimentService.create(experiment);
  }

  /**
   * @swagger
   * /experiments/{id}:
   *    delete:
   *       description: Delete experiment by id
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete Experiment By Id
   */

  @Delete('/:id')
  public delete(@Param('id') id: string): Promise<Experiment | undefined> {
    if (!validator.isUUID(id)) {
      return Promise.reject(new Error(SERVER_ERROR.INCORRECT_PARAM_FORMAT + ' : id should be of type UUID.'));
    }
    return this.experimentService.delete(id);
  }

  /**
   * @swagger
   * /experiments/{id}:
   *    put:
   *       description: Create New Experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Id
   *         - in: body
   *           name: experiment
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/Experiment'
   *           description: Experiment Structure
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment is updated
   */
  @Put('/:id')
  public update(
    @Param('id') id: string,
    @Body({ validate: { validationError: { target: false, value: false }, skipMissingProperties: true } })
    experiment: Experiment
  ): Promise<Experiment> {
    return this.experimentService.update(id, experiment);
  }
}
