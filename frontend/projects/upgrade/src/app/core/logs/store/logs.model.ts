import { AppState } from '../../core.module';
import { EntityState } from '@ngrx/entity';
import { EXPERIMENT_LOG_TYPE, SERVER_ERROR } from 'upgrade_types';

export { EXPERIMENT_LOG_TYPE, SERVER_ERROR };

export const NUMBER_OF_LOGS = 20;

export enum LogType {
  ERROR_LOG = 'Error log',
  AUDIT_LOG = 'Audit log',
}

export enum LogDateFormatType {
  DATE_MONTH = 'dateMonth',
  YEAR_DAY = 'yearDay',
}

export interface AuditLogParams {
  skip: number;
  take: number;
  filter?: EXPERIMENT_LOG_TYPE;
}

export interface ErrorLogParams {
  skip: number;
  take: number;
  filter?: SERVER_ERROR;
}

export interface AuditLogs {
  id: string;
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  type: EXPERIMENT_LOG_TYPE;
  data: any;
}

export interface ErrorLogs {
  id: string;
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  type: SERVER_ERROR;
  endPoint: string;
  errorCode: number | null;
  message: string;
  name: string;
}

export interface LogState extends EntityState<AuditLogs | ErrorLogs> {
  isAuditLogLoading: boolean;
  isErrorLogLoading: boolean;
  skipAuditLog: number;
  totalAuditLogs: number;
  skipErrorLog: number;
  totalErrorLogs: number;
  auditLogFilter: EXPERIMENT_LOG_TYPE;
  errorLogFilter: SERVER_ERROR;
}

export interface State extends AppState {
  logs: LogState;
}
