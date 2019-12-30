import { JsonController, Post, Body } from 'routing-controllers';
import { AuditService } from '../services/AuditService';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';

interface ExperimentAuditPaginationInfo {
  total: number;
  limit: number;
  offset: number;
  nodes: ExperimentAuditLog[];
}

interface IAuditParams {
  limit: number;
  offset: number;
}

/**
 * @swagger
 * tags:
 *   - name: Audit Logs
 *     description: Get audit logs for experiment
 */
@JsonController('/audit')
export class AuditLogController {
  constructor(public auditService: AuditService) {}

  /**
   * @swagger
   * /audit:
   *    post:
   *       description: Get audit-logs
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: limit
   *           required: true
   *           schema:
   *             type: integer
   *             example: 10
   *           description: number of audit logs to requests
   *         - in: body
   *           name: offset
   *           required: true
   *           schema:
   *             type: integer
   *             example: 5
   *           description: skip number of offset to audit logs
   *       tags:
   *         - Audit Logs
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: List of Audit Logs
   */
  @Post('/')
  public async getAuditLogService(@Body() auditParams: IAuditParams): Promise<ExperimentAuditPaginationInfo> {
    const [nodes, total] = await Promise.all([
      this.auditService.getAuditLogs(auditParams.limit, auditParams.offset),
      this.auditService.getTotalLogs(),
    ]);
    return {
      total,
      nodes,
      ...auditParams,
    };
  }
}
