import { JsonController, Post, Body, Req } from 'routing-controllers';
import { SupportGetAssignmentParamsValidator } from './validators/SupportGetAssignmentParamsValidator';
import { IExperimentAssignment } from 'upgrade_types';
import { SupportService } from '../services/SupportService';
import { AppRequest } from '../../types';

/**
 * @swagger
 * tags:
 *   - name: Support Endpoint
 *     description: Support Endpoint
 */

@JsonController('/support')
export class SupportToolController {
  constructor(public supportService: SupportService) {}

  /**
   * @swagger
   * /support/assignment:
   *    post:
   *       description: Get Experiment Assignments
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
   *         - Support Endpoint
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get Experiment Assignments
   */
  @Post('/assignment')
  public getAssignments(
    @Body({ validate: { validationError: { target: true, value: true } } })
    assignmentParams: SupportGetAssignmentParamsValidator, 
    @Req() request: AppRequest
  ): Promise<IExperimentAssignment[]> {
    return this.supportService.getAssignments(assignmentParams.userId, assignmentParams.context, request.logger);
  }
}
