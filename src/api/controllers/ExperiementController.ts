import { Body, Get, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers';
import { Experiment } from '../models/Experiment';
import { ExperimentNotFoundError } from '../errors/ExperimentNotFoundError';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentSegment } from '../models/ExperimentSegment';

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
 *       - group
 *       - conditions
 *       - segments
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
 *       consistencyRule:
 *         type: string
 *         enum: [individual, experiment, group]
 *       assignmentUnit:
 *         type: string
 *         enum: [individual, group]
 *       postExperimentRule:
 *         type: string
 *         enum: [continue, revertToDefault]
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
 *       segments:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             id:
 *               type: string
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
    return this.experimentService.findOne(id);
  }

  /**
   * @swagger
   * /experiments/conditions/{id}/{point}:
   *    get:
   *       description: Get experiment conditions
   *       parameters:
   *         - in: path
   *           name: id
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Segment Id
   *         - in: path
   *           name: point
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Segment Point
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
  @Get('/conditions/:id/:point')
  @OnUndefined(ExperimentNotFoundError)
  public getCondition(@Param('id') id: string, @Param('point') point: string): Promise<ExperimentSegment> | undefined {
    return this.experimentService.getExperimentalConditions(id, point);
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
  public create(@Body() experiment: Experiment): Promise<Experiment> {
    return this.experimentService.create(experiment);
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
  public update(@Param('id') id: string, @Body() experiment: Experiment): Promise<Experiment> {
    return this.experimentService.update(id, experiment);
  }
}
