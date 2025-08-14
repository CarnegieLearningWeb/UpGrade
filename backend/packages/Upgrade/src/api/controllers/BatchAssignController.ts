import { JsonController, Post, Authorized, Req, Body } from 'routing-controllers';
import { AppRequest } from '../../types';
import { BatchAssignValidator } from '../controllers/validators/BatchAssignValidator';
import { ExperimentAssignmentService } from '../services/ExperimentAssignmentService';
import { ExperimentUserService } from '../services/ExperimentUserService';
import { IExperimentAssignmentv5 } from 'upgrade_types';

@Authorized()
@JsonController('/batch-assign')
export class BatchAssignController {
  constructor(
    public experimentAssignmentService: ExperimentAssignmentService,
    public experimentUserService: ExperimentUserService
  ) {}
  /**
   * @swagger
   * /batch-assign:
   *    post:
   *       description: Get Batch Assignments for students
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: body
   *           description: Batch Assign Request Body
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               userIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               context:
   *                 type: string
   *               site:
   *                 type: string
   *               target:
   *                 type: string
   *       produces:
   *         - application/json
   *       tags:
   *         - BatchAssign
   *       responses:
   *          '200':
   *            description: Get Batch Assignments for students
   *            schema:
   *              type: object
   *              additionalProperties:
   *                type: object
   *                required:
   *                  - site
   *                  - target
   *                  - condition
   *                properties:
   *                  site:
   *                    type: string
   *                    minLength: 1
   *                  target:
   *                    type: string
   *                    minLength: 1
   *                  experimentType:
   *                    type: string
   *                    enum: [Simple, Factorial]
   *                  assignedCondition:
   *                    type: array
   *                    items:
   *                      type: object
   *                      properties:
   *                         conditionCode:
   *                          type: string
   *                          minLength: 1
   *                         payload:
   *                          type: object
   *                          properties:
   *                            type:
   *                              type: string
   *                            value:
   *                              type: string
   *                         id:
   *                          type: string
   *                         experimentId:
   *                          type: string
   *              example:
   *                {
   *                  "user1": {
   *                    "site": "site1",
   *                    "target": "target1",
   *                    "condition": "condition1",
   *                    "experimentType": "Simple",
   *                    "assignedCondition": [
   *                      {
   *                        "conditionCode": "condition1",
   *                        "payload": {
   *                          "type": "type1",
   *                          "value": "value1"
   *                        },
   *                        "id": "conditionId1",
   *                        "experimentId": "experimentId1"
   *                      }
   *                    ]
   *                  },
   *                  "user2": null
   *                }
   *          '400':
   *            description: BadRequestError - InvalidParameterValue
   *          '401':
   *            description: AuthorizationRequiredError
   *          '500':
   *            description: Internal Server Error
   */
  @Post('/')
  public async getBatchAssignments(
    @Body({ validate: true }) requestBody: BatchAssignValidator,
    @Req() request: AppRequest
  ): Promise<Record<string, IExperimentAssignmentv5 | null>> {
    request.logger.info({ message: 'Request received for batch assignments' });
    const { context, site, target, userIds } = requestBody;
    request.logger.info({
      message: `Context: ${context}, Site: ${site}, Target: ${target}, User IDs: ${userIds.join(', ')}`,
    });

    // Initialize response with nulls for all userIds
    const nullResponse = userIds.reduce((acc, userId) => {
      acc[userId] = null; // Initialize with null for each userId
      return acc;
    }, {});

    const userDocs = await this.experimentUserService.getUserDocs(userIds, request.logger);
    request.logger.info({ message: `User Docs: ${JSON.stringify(userDocs)}` });

    const assignments = await this.experimentAssignmentService.getBatchExperimentConditions(
      userDocs,
      context,
      site,
      target,
      request.logger
    );

    return { ...nullResponse, ...assignments };
  }
}
