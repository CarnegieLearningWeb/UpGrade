import {
  Body,
  Get,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put,
  Delete,
  Authorized,
  CurrentUser,
} from 'routing-controllers';
import { Experiment } from '../models/Experiment';
import { ExperimentNotFoundError } from '../errors/ExperimentNotFoundError';
import { ExperimentService } from '../services/ExperimentService';
import { SERVER_ERROR } from 'ees_types';
import { Validator, validate } from 'class-validator';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { PaginatedParamsValidator } from './validators/PaginatedParamsValidator';
import { User } from '../models/User';
import { ExperimentPartition } from '../models/ExperimentPartition';
import { IUniqueIds } from '../../types/index';
import { AssignmentStateUpdateValidator } from './validators/AssignmentStateUpdateValidator';
import { env } from '../../env';
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
@Authorized()
@JsonController('/experiments')
export class ExperimentController {
  constructor(public experimentService: ExperimentService) {}

  /**
   * @swagger
   * /experiments/names:
   *    get:
   *       description: Get all the experiment names
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment Name List
   */
  @Get('/names')
  public findName(): Promise<Array<Pick<Experiment, 'id' | 'name'>>> {
    return this.experimentService.findAllName();
  }

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
    @Body({ validate: { validationError: { target: true, value: true } } }) paginatedParams: PaginatedParamsValidator
  ): Promise<ExperimentPaginationInfo> {
    if (!paginatedParams) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.MISSING_PARAMS, message: ' : paginatedParams should not be null.' })
        )
      );
    }

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
   * /experiments/partitions:
   *    get:
   *       description: Get all experiment partitions
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get All Experiment Partitions
   *          '404':
   *            description: Experiment Partitions not found
   */
  @Get('/partitions')
  public getAllExperimentPoints(): Promise<Array<Pick<ExperimentPartition, 'point' | 'name'>>> {
    return this.experimentService.getAllExperimentPartitions();
  }

  /**
   * @swagger
   * /experiments/uniqueIdentifier:
   *    get:
   *       description: Get all unique identifier
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get All Unique Identifier
   *          '404':
   *            description: Unique Identifier not found
   */
  @Get('/uniqueIdentifier')
  public getAllUniqueIdentifier(): Promise<IUniqueIds> {
    return this.experimentService.getAllUniqueIdentifiers();
  }

  /**
   * @swagger
   * /experiments/single/{id}:
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
  @Get('/single/:id')
  @OnUndefined(ExperimentNotFoundError)
  public one(@Param('id') id: string): Promise<Experiment> | undefined {
    if (!validator.isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
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
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
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
    @Body({ validate: { validationError: { target: false, value: false } } }) experiment: Experiment,
    @CurrentUser() currentUser: User
  ): Promise<Experiment> {
    return this.experimentService.create(experiment, currentUser);
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
  public delete(@Param('id') id: string, @CurrentUser() currentUser: User): Promise<Experiment | undefined> {
    if (!validator.isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentService.delete(id, currentUser);
  }

  /**
   * @swagger
   * /experiments/state:
   *    post:
   *       description: Update Experiment State
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experimentId
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment ID
   *         - in: body
   *           name: state
   *           required: true
   *           schema:
   *             type: object
   *             $ref: '#/definitions/Experiment/state'
   *           description: Experiment State
   *       tags:
   *         - Experiments
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment State is updated
   */
  @Post('/state')
  public async updateState(
    @Body({ validate: { validationError: { target: false, value: false } } })
    experiment: AssignmentStateUpdateValidator,
    @CurrentUser() currentUser: User
  ): Promise<any> {
    if (env.auth.authCheck) {
      if (!currentUser) {
        return Promise.reject(
          new Error(JSON.stringify({ type: SERVER_ERROR.MISSING_PARAMS, message: ' : currentUser should not be null' }))
        );
      }

      await validate(currentUser).catch(error => {
        return Promise.reject(new Error(error));
      });
    }

    return this.experimentService.updateState(
      experiment.experimentId,
      experiment.state,
      currentUser,
      experiment.scheduleDate
    );
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
    experiment: Experiment,
    @CurrentUser() currentUser: User
  ): Promise<Experiment> {
    if (!validator.isUUID(id)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : id should be of type UUID.' })
        )
      );
    }
    return this.experimentService.update(id, experiment, currentUser);
  }
}
