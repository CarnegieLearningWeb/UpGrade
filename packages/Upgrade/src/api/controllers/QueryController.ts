import { Authorized, JsonController, Post, Body } from 'routing-controllers';
import { QueryService } from '../services/QueryService';
import { DataLogAnalysisValidator } from './validators/DataLogAnalysisValidator';
import { DataLogService } from '../services/DataLogService';

/**
 * @swagger
 * tags:
 *   - name: Query
 *     description: Get Query details
 */
@Authorized()
@JsonController('/query')
export class QueryController {
  constructor(public queryService: QueryService, public dataLogService: DataLogService) {}

  /**
   * @swagger
   * /query/analyse:
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
   *               queryId:
   *                 type: string
   *           description: Data analysis
   *       tags:
   *         - Query
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
    return this.queryService.analyse(dataLogParams.queryId);
  }
}
