import { Authorized, JsonController, Get, Delete, Param } from 'routing-controllers';
import { MetricService } from '../services/MetricService';
import { IMetricUnit, SERVER_ERROR } from 'upgrade_types';

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
  public getAllMetrics(): Promise<IMetricUnit[]> {
    return this.metricService.getAllMetrics();
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
  public delete(@Param('key') key: string): Promise<IMetricUnit[] | undefined> {
    if (!key) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : key should not be null.'));
    }
    return this.metricService.deleteMetric(key);
  }
}
