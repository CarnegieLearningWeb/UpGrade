import { Authorized, JsonController, Post, Body, Req } from 'routing-controllers';
import { QueryService } from '../services/QueryService';
import { DataLogAnalysisValidator } from './validators/DataLogAnalysisValidator';
import { DataLogService } from '../services/DataLogService';
import { AppRequest } from '../../types';

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
   *               queryIds:
   *                 type: array
   *                 items:
   *                  type: string
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
    @Body({ validate: true })
    dataLogParams: DataLogAnalysisValidator,
    @Req() request: AppRequest
  ): Promise<any> {
    return this.queryService.analyze(dataLogParams.queryIds, request.logger);
  }
}
