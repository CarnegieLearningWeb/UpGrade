import { Authorized, JsonController, Get, Post, Body } from 'routing-controllers';
import { QueryService } from '../services/QueryService';
import { Query } from '../models/Query';
import { QueryValidator } from './validators/QueryValidator';

/**
 * @swagger
 * tags:
 *   - name: Query
 *     description: Get Query details
 */
@Authorized()
@JsonController('/query')
export class QueryController {
  constructor(public queryService: QueryService) {}

  /**
   * @swagger
   * /query:
   *    get:
   *       description: Get all queries
   *       tags:
   *         - Query
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get all Queries
   */
  @Get()
  public async getAllQuery(): Promise<Query[]> {
    return this.queryService.find();
  }

  /**
   * @swagger
   * /query:
   *    post:
   *       description: Save query in an experiment
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: params
   *            schema:
   *             type: object
   *             properties:
   *              query:
   *                type: object
   *              metric:
   *                type: string
   *              experimentId:
   *                type: string
   *       tags:
   *         - Query
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Filtered Metrics
   */
  @Post()
  public async saveQuery(
    @Body({ validate: { validationError: { target: true, value: true } } })
    queryValidator: QueryValidator
  ): Promise<Query> {
    return this.queryService.saveQuery(queryValidator.query, queryValidator.metric, queryValidator.experimentId);
  }
}
