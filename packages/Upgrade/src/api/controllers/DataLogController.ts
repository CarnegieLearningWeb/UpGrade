import { Authorized, JsonController, Post, Body } from 'routing-controllers';
import { DataLogService } from '../services/DataLogService';
import { DataLogAnalysisValidator } from './validators/DataLogAnalysisValidator';

/**
 * @swagger
 * tags:
 *   - name: Data Log
 *     description: Data log analysis
 */

@Authorized()
@JsonController('/datalog')
export class DataLogController {
  constructor(public dataLogService: DataLogService) {}

  /**
   * @swagger
   * /datalog/analyse:
   *    post:
   *       description: Data log analysis
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *               experimentId:
   *                 type: string
   *               metrics:
   *                 type: array
   *                 items:
   *                  type: string
   *               operationTypes:
   *                 type: string
   *                 enum: [sum, count, avg, min, max]
   *               timeRange:
   *                 type: object
   *           description: Data analysis
   *       tags:
   *         - Data Log
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get data analysis
   */
  @Post('/analyse')
  public analyse(
    @Body({ validate: { validationError: { target: true, value: true } } })
    dataLogParams: DataLogAnalysisValidator
  ): Promise<any> {
    return this.dataLogService.analyse(
      dataLogParams.experimentId,
      dataLogParams.metrics,
      dataLogParams.operationTypes,
      dataLogParams.timeRange
    );
  }
}
