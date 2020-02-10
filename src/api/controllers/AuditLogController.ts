import { JsonController, Post, Body, Authorized } from 'routing-controllers';
import { AuditService } from '../services/AuditService';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { ExperimentError } from '../models/ExperimentError';
import { ErrorService } from '../services/ErrorService';

interface ExperimentAuditPaginationInfo {
  total: number;
  skip: number;
  take: number;
  nodes: ExperimentAuditLog[];
}

interface ExperimentErrorPaginatedInfo {
  total: number;
  skip: number;
  take: number;
  nodes: ExperimentError[];
}

interface ILogParams {
  skip: number;
  take: number;
}

/**
 * @swagger
 * tags:
 *   - name: Logs
 *     description: Get logs for experiment
 */
@Authorized()
@JsonController('/')
export class AuditLogController {
  constructor(public auditService: AuditService, public errorService: ErrorService) {}

  /**
   * @swagger
   * /audit:
   *    post:
   *       description: Get audit-logs
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - skip
   *               - take
   *             properties:
   *               skip:
   *                type: integer
   *               take:
   *                type: integer
   *           description: number of audit logs to requests
   *       tags:
   *         - Logs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: List of Audit Logs
   */
  @Post('/audit')
  public async getAuditLogService(@Body() logParams: ILogParams): Promise<ExperimentAuditPaginationInfo> {
    const [nodes, total] = await Promise.all([
      this.auditService.getAuditLogs(logParams.take, logParams.skip),
      this.auditService.getTotalLogs(),
    ]);
    return {
      total,
      nodes,
      ...logParams,
    };
  }

  /**
   * @swagger
   * /error:
   *    post:
   *       description: Get error-logs
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             required:
   *               - skip
   *               - take
   *             properties:
   *               skip:
   *                type: integer
   *               take:
   *                type: integer
   *           description: number of error logs to requests
   *       tags:
   *         - Logs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: List of Error Logs
   */
  @Post('/error')
  public async getErrorLogService(@Body() logParams: ILogParams): Promise<ExperimentErrorPaginatedInfo> {
    const [nodes, total] = await Promise.all([
      this.errorService.getErrorLogs(logParams.take, logParams.skip),
      this.errorService.getTotalLogs(),
    ]);

    return {
      total,
      nodes,
      ...logParams,
    };
  }
}
