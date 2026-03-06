import { JsonController, Post, Body, UseBefore, Req } from 'routing-controllers';
import { ScheduledJobsParamsValidator } from './validators/ScheduledJobsParamsValidator';
import { ScheduledJobService } from '../services/ScheduledJobService';
import { ScheduleJobMiddleware } from '../middlewares/ScheduleJobMiddleware';
import bodyParser from 'body-parser';
import { AppRequest } from '../../types';

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
    @Body({ validate: true })
    scheduledParams: ScheduledJobsParamsValidator,
    @Req() request: AppRequest
  ): Promise<any> {
    return this.scheduledJobService.startExperiment(scheduledParams.id, request.logger);
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
    @Body({ validate: true })
    scheduledParams: ScheduledJobsParamsValidator,
    @Req() request: AppRequest
  ): Promise<any> {
    return this.scheduledJobService.endExperiment(scheduledParams.id, request.logger);
  }

  /**
   * @swagger
   * /scheduledJobs/clearLogs:
   *    post:
   *       description: Clear audit and error logs
   *       consumes:
   *         - application/json
   *       tags:
   *         - Scheduled Jobs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Clear audit and error logs
   */
  @Post('/clearLogs')
  public async clearLogs(@Req() request: AppRequest): Promise<boolean> {
    return this.scheduledJobService.clearLogs(request.logger);
  }
}
