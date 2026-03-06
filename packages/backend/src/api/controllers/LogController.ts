import { JsonController, Post, Body, Authorized } from 'routing-controllers';
import { AuditService } from '../services/AuditService';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { ExperimentError } from '../models/ExperimentError';
import { ErrorService } from '../services/ErrorService';
import { ErrorLogParamsValidator } from './validators/ErrorLogParamsValidator';
import { AuditLogParamsValidator } from './validators/AuditLogParamsValidators';
import { PaginationResponse } from '../../types';

interface ExperimentAuditPaginationInfo extends PaginationResponse {
  nodes: ExperimentAuditLog[];
}

interface ExperimentErrorPaginatedInfo extends PaginationResponse {
  nodes: ExperimentError[];
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
   *               filter:
   *                type: string
   *                enum: [experimentCreated, experimentUpdated, experimentStateChanged, experimentDeleted]
   *           description: number of audit logs to requests
   *       tags:
   *         - Logs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: List of Audit Logs
   */
  @Post('audit')
  public async getAuditLogService(
    @Body({ validate: true }) logParams: AuditLogParamsValidator
  ): Promise<ExperimentAuditPaginationInfo> {
    const [nodes, total] = await Promise.all([
      this.auditService.getAuditLogs(logParams.take, logParams.skip, logParams.filter),
      this.auditService.getTotalLogs(logParams.filter),
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
   *               filter:
   *                type: string
   *                enum: [Database not reachable,
   *                       Database auth fail, Error in the assignment algorithm,
   *                       Parameter missing in the client request,
   *                       Parameter not in the correct format,
   *                       User ID not found,
   *                       Query Failed,
   *                       Error reported from client,
   *                       Experiment user not defined,
   *                       Experiment user group not defined,
   *                       Email send error,
   *                       Working group is not a subset of user group,]
   *           description: number of error logs to requests
   *       tags:
   *         - Logs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: List of Error Logs
   */
  @Post('error')
  public async getErrorLogService(
    @Body({ validate: true }) logParams: ErrorLogParamsValidator
  ): Promise<ExperimentErrorPaginatedInfo> {
    const [nodes, total] = await Promise.all([
      this.errorService.getErrorLogs(logParams.take, logParams.skip, logParams.filter),
      this.errorService.getTotalLogs(logParams.filter),
    ]);

    return {
      total,
      nodes,
      ...logParams,
    };
  }
}
