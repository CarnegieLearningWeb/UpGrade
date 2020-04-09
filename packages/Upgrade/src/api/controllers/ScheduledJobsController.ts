import { JsonController, Post, Body, UseBefore } from 'routing-controllers';
import { ScheduledJobsParamsValidator } from './validators/ScheduledJobsParamsValidator';
import { ScheduledJobService } from '../services/ScheduledJobService';
import { ScheduleJobMiddleware } from '../middlewares/ScheduleJobMiddleware';
import bodyParser from 'body-parser';

@JsonController('/scheduledJobs')
@UseBefore(ScheduleJobMiddleware)
@UseBefore(bodyParser.json())
export class ScheduledJobsController {
  constructor(public scheduledJobService: ScheduledJobService) {}

  /**
   * @swagger
   * /scheduledJobs/start:
   *    post:
   *       description: Change experiment state to Enrolling
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - id
   *             properties:
   *               id:
   *                type: string
   *           description: Change experiment state to enrolling
   *       tags:
   *         - Scheduled Jobs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Change Experiment Status to enrolling
   */
  @Post('/start')
  public async startExperiment(
    @Body({ validate: { validationError: { target: true, value: true } } })
    scheduledParams: ScheduledJobsParamsValidator
  ): Promise<any> {
    return this.scheduledJobService.startExperiment(scheduledParams.id);
  }

  /**
   * @swagger
   * /scheduledJobs/end:
   *    post:
   *       description: Change experiment state to EnrollmentComplete
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - id
   *             properties:
   *               id:
   *                type: string
   *           description: Change experiment state to EnrollmentComplete
   *       tags:
   *         - Scheduled Jobs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Change experiment state to EnrollmentComplete
   */
  @Post('/end')
  public async endExperiment(
    @Body({ validate: { validationError: { target: true, value: true } } })
    scheduledParams: ScheduledJobsParamsValidator
  ): Promise<any> {
    return this.scheduledJobService.endExperiment(scheduledParams.id);
  }
}
