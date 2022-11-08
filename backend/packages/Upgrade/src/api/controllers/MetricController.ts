import { Authorized, JsonController, Get, Delete, Param, Post, BodyParam, Req } from 'routing-controllers';
import { MetricService } from '../services/MetricService';
import { IMetricUnit, SERVER_ERROR, ISingleMetric, IGroupMetric } from 'upgrade_types';
import { AppRequest } from '../../types';

/**
 * @swagger
 * tags:
 *   - name: Metrics
 *     description: Get metrics details for the system
 */
@Authorized()
@JsonController('/metric')
export class MetricController {
  constructor(public metricService: MetricService) {}

  /**
   * @swagger
   * /metric:
   *    get:
   *       description: Get all metrics tracked
   *       tags:
   *         - Metrics
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get all Metrics
   */
  @Get()
  public getAllMetrics(@Req() request: AppRequest): Promise<IMetricUnit[]> {
    return this.metricService.getAllMetrics(request.logger);
  }

  /**
   * @swagger
   * /metric/save:
   *    post:
   *       description: Add filter metrics
   *       consumes:
   *         - application/json
   *       parameters:
   *          - in: body
   *            name: params
   *            schema:
   *             type: object
   *             properties:
   *              metricUnit:
   *                type: object
   *            description: Filtered Metrics
   *       tags:
   *         - Experiment Point
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Filtered Metrics
   */
  @Post('/save')
  public filterMetrics(
    @BodyParam('metricUnit') metricUnit: Array<ISingleMetric | IGroupMetric>,
    @Req() request: AppRequest
  ): Promise<IMetricUnit[]> {
    return this.metricService.upsertAllMetrics(metricUnit, request.logger);
  }

  /**
   * @swagger
   * /metric/{key}:
   *    delete:
   *       description: Delete Metric
   *       parameters:
   *         - in: path
   *           name: key
   *           required: true
   *           schema:
   *             type: string
   *           description: Metric key
   *       tags:
   *         - Metrics
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Delete metric by key
   */
  @Delete('/:key')
  public delete(@Param('key') key: string, @Req() request: AppRequest): Promise<IMetricUnit[] | undefined> {
    if (!key) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : key should not be null.'));
    }
    return this.metricService.deleteMetric(key, request.logger);
  }
}
