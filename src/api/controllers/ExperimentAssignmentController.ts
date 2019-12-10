import { JsonController, Post, BodyParam, Put } from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { EXPERIMENT_STATE } from 'ees_types';

/**
 * @swagger
 * tags:
 *   - name: Experiment Point
 *     description: CRUD operations related to experiments points
 */
@JsonController('/')
export class ExperimentConditionController {
  constructor(
    public experimentService: ExperimentService,
    public experimentAssignmentService: ExperimentAssignmentService
  ) {}

  /**
   * @swagger
   * /mark:
   *    post:
   *       description: Mark a Experiment Point
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
   *           name: experimentPoint
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Point
   *         - in: body
   *           name: userId
   *           required: true
   *           schema:
   *             type: string
   *           description: User ID
   *         - in: body
   *           name: userEnvironment
   *           required: true
   *           schema:
   *             type: object
   *           description: User Environment
   *       tags:
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment Point is Marked
   */
  @Post('mark')
  public markExperimentPoint(
    @BodyParam('experimentId') experimentId: string,
    @BodyParam('experimentPoint') experimentPoint: string,
    @BodyParam('userId') userId: string,
    @BodyParam('userEnvironment') userEnvironment: object
  ): any {
    return this.experimentAssignmentService.markExperimentPoint(experimentId, experimentPoint, userId, userEnvironment);
  }

  /**
   * @swagger
   * /assign:
   *    post:
   *       description: Assign a Experiment Point
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: userId
   *            required: true
   *            schema:
   *             type: string
   *            description: User ID
   *          - in: body
   *            name: userEnvironment
   *            required: true
   *            schema:
   *             type: object
   *            description: User Environment
   *       tags:
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment Point is Assigned
   */
  @Post('assign')
  public getAllExperimentConditions(
    @BodyParam('userId') userId: string,
    @BodyParam('userEnvironment') userEnvironment: any
  ): any {
    return this.experimentAssignmentService.getAllExperimentConditions(userId, userEnvironment);
  }

  /**
   * @swagger
   * /state/:
   *    put:
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
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Experiment State is updated
   */
  @Put('state')
  public updateState(
    @BodyParam('experimentId') experimentId: string,
    @BodyParam('state') state: EXPERIMENT_STATE
  ): any {
    return this.experimentAssignmentService.updateState(experimentId, state);
  }
}
