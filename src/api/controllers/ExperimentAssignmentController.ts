import { JsonController, Post, Put, Body, Authorized, CurrentUser } from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { MarkExperimentValidator } from './validators/MarkExperimentValidator';
import { ExperimentAssignmentValidator } from './validators/ExperimentAssignmentValidator';
import { AssignmentStateUpdateValidator } from './validators/AssignmentStateUpdateValidator';
import { User } from '../models/User';
import { validate } from 'class-validator';
import { env } from '../../env';
import { SERVER_ERROR } from 'ees_types';

/**
 * @swagger
 * tags:
 *   - name: Experiment Point
 *     description: CRUD operations related to experiments points
 */
@Authorized()
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    experiment: MarkExperimentValidator
  ): any {
    return this.experimentAssignmentService.markExperimentPoint(
      experiment.experimentId,
      experiment.experimentPoint,
      experiment.userId,
      experiment.userEnvironment
    );
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
    @Body({ validate: { validationError: { target: false, value: false } } })
    experiment: ExperimentAssignmentValidator
  ): any {
    return this.experimentAssignmentService.getAllExperimentConditions(experiment.userId, experiment.userEnvironment);
  }

  /**
   * @swagger
   * /state:
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

    return this.experimentAssignmentService.updateState(experiment.experimentId, experiment.state, currentUser);
  }
}
