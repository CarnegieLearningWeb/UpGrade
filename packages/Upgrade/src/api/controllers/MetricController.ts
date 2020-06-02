import { Authorized, JsonController, Get } from 'routing-controllers';
import { MetricService } from '../services/MetricService';
import { MetricUnit } from '../../types/ExperimentInput';

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
  public getAllMetrics(): Promise<MetricUnit[]> {
    return this.metricService.getAllMetrics();
  }
}
