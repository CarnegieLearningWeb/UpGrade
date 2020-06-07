import { Authorized, JsonController, Get } from 'routing-controllers';
import { MetricService } from '../services/MetricService';
import { IMetricUnit } from 'upgrade_types';

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
}
