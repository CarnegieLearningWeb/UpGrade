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
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { UpdateWorkingGroupValidator } from './validators/UpdateWorkingGroupValidator';

/**
 * @swagger
 * tags:
 *   - name: Experiment Point
 *     description: CRUD operations related to experiments points
 */
@Authorized()
@JsonController('/')
export class ExperimentClientController {
  constructor(
    public experimentService: ExperimentService,
    public experimentAssignmentService: ExperimentAssignmentService,
    public experimentUserService: ExperimentUserService
  ) {}

  /**
   * @swagger
   * /init:
   *    post:
   *       description: Create/Update Experiment User
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experimentUser
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *               group:
   *                 type: object
   *               workingGroup:
   *                 type: object
   *           description: ExperimentUser
   *       tags:
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Set Group Membership
   */
  @Post('init')
  public async init(
    @Body({ validate: { validationError: { target: false, value: false } } })
    experimentUser: ExperimentUser
  ): Promise<ExperimentUser> {
    const document = await this.experimentUserService.create([experimentUser]);
    return document[0];
  }

  /**
   * @swagger
   * /groupmembership:
   *    post:
   *       description: Set group membership for a user
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: experimentUser
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *               group:
   *                 type: object
   *           description: ExperimentUser
   *       tags:
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Set Group Membership
   */
  @Post('groupmembership')
  public setGroupMemberShip(
    @Body({ validate: { validationError: { target: false, value: false } } })
    experimentUser: ExperimentUser
  ): Promise<ExperimentUser> {
    return this.experimentUserService.updateGroupMembership(experimentUser.id, experimentUser.group);
  }

  /**
   * @swagger
   * /workinggroup:
   *    post:
   *       description: Set working group for a user
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   *               workingGroup:
   *                 type: object
   *           description: ExperimentUser
   *       tags:
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Set Group Membership
   */
  @Post('workinggroup')
  public setWorkingGroup(
    @Body({ validate: { validationError: { target: false, value: false } } })
    workingGroupParams: UpdateWorkingGroupValidator
  ): Promise<ExperimentUser> {
    return this.experimentUserService.updateWorkingGroup(workingGroupParams.id, workingGroupParams.workingGroup);
  }

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
      experiment.userId
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
    return this.experimentAssignmentService.getAllExperimentConditions(experiment.userId);
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
