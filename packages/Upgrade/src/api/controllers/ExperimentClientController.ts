import { JsonController, Post, Body, UseBefore } from 'routing-controllers';
import { ExperimentService } from '../services/ExperimentService';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { MarkExperimentValidator } from './validators/MarkExperimentValidator';
import { ExperimentAssignmentValidator } from './validators/ExperimentAssignmentValidator';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { UpdateWorkingGroupValidator } from './validators/UpdateWorkingGroupValidator';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { IExperimentAssignment } from 'upgrade_types';
import { FailedParamsValidator } from './validators/FailedParamsValidator';
import { ExperimentError } from '../models/ExperimentError';
import { ClientLibMiddleware } from '../middlewares/ClientLibMiddleware';

/**
 * @swagger
 * tags:
 *   - name: Experiment Point
 *     description: CRUD operations related to experiments points
 */

@JsonController('/')
@UseBefore(ClientLibMiddleware)
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
   *           name: userId
   *           required: true
   *           schema:
   *             type: string
   *           description: User ID
   *         - in: body
   *           name: experimentPoint
   *           required: true
   *           schema:
   *             type: string
   *           description: Experiment Point
   *         - in: body
   *           name: partitionId
   *           required: true
   *           schema:
   *             type: string
   *           description: Partition ID
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
  ): Promise<MonitoredExperimentPoint> {
    return this.experimentAssignmentService.markExperimentPoint(
      experiment.userId,
      experiment.experimentPoint,
      experiment.partitionId
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
   *            name: user
   *            required: true
   *            schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               context:
   *                 type: string
   *            description: User Document
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
  ): Promise<IExperimentAssignment[]> {
    return this.experimentAssignmentService.getAllExperimentConditions(experiment.userId, experiment.context);
  }

  /**
   * @swagger
   * /failed:
   *    post:
   *       description: Add error from client end
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

  /**
   * @swagger
   * /failed:
   *    post:
   *       description: Add error from client end
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: experimentError
   *            required: false
   *            schema:
   *             type: object
   *             properties:
   *              reason:
   *                type: string
   *              experimentPoint:
   *                type: string
   *              experimentId:
   *                type: string
   *            description: Experiment Error from client
   *       tags:
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Client side reported error
   */
  @Post('failed')
  public failedExperimentPoint(
    @Body({ validate: { validationError: { target: false, value: false } } })
    errorBody: FailedParamsValidator
  ): Promise<ExperimentError> {
    return this.experimentAssignmentService.clientFailedExperimentPoint(
      errorBody.reason,
      errorBody.experimentPoint,
      errorBody.userId,
      errorBody.experimentId
    );
  }
}
