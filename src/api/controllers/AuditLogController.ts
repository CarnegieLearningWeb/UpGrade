import { JsonController, Post, Body } from 'routing-controllers';
import { AuditService } from '../services/AuditService';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';

interface ExperimentAuditPaginationInfo {
  total: number;
  skip: number;
  take: number;
  nodes: ExperimentAuditLog[];
}

interface IAuditParams {
  skip: number;
  take: number;
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
      this.auditService.getAuditLogs(auditParams.take, auditParams.skip),
      this.auditService.getTotalLogs(),
    ]);
    return {
      total,
      nodes,
      ...auditParams,
    };
  }
}
