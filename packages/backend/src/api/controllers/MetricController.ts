import { Authorized, JsonController, Get, Delete, Post, Req, Body, Params } from 'routing-controllers';
import { MetricService } from '../services/MetricService';
import { IMetricUnit } from 'upgrade_types';
import { AppRequest } from '../../types';
import { ContextValidator, MetricKeyValidator, MetricValidator } from './validators/MetricValidator';

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
   * /metric/{context}:
   *    get:
   *       description: Get all metrics with context
   *       parameters:
   *         - in: path
   *           name: context
   *           required: true
   *           schema:
   *             type: string
   *           description: context
   *       tags:
   *         - Metrics
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get all metrics with context
   *          '404':
   *            description: Metrics Context not found
   */
  @Get('/:context')
  public getMetricsByContext(
    @Params({ validate: true }) { context }: ContextValidator,
    @Req() request: AppRequest
  ): Promise<IMetricUnit[]> {
    return this.metricService.getMetricsByContext(context, request.logger);
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
   *                type: array
   *                items:
   *                  type: object
   *                  properties:
   *                    metric:
   *                      type: string
   *                      example: completionStatus
   *                    datatype:
   *                      type: string
   *                      enum: [categorical, continuous]
   *                    allowedValues:
   *                      type: array
   *                    children:
   *                      type: array
   *              context:
   *                type: array
   *                items:
   *                  type: string
   *            description: Filtered Metrics
   *       tags:
   *         - Metrics
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Filtered Metrics
   */
  @Post('/save')
  public filterMetrics(
    @Body({ validate: true }) metric: MetricValidator,
    @Req() request: AppRequest
  ): Promise<IMetricUnit[]> {
    return this.metricService.upsertAllMetrics(metric.metricUnit, metric.context, request.logger);
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
   *          '404':
   *            description: Metrics key not found
   */
  @Delete('/:key')
  public delete(
    @Params({ validate: true }) { key }: MetricKeyValidator,
    @Req() request: AppRequest
  ): Promise<IMetricUnit[] | undefined> {
    return this.metricService.deleteMetric(key, request.logger);
  }
}
