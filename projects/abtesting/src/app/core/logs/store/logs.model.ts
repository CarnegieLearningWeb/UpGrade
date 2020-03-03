import { AppState } from '../../core.module';
import { EntityState } from '@ngrx/entity';
import { EXPERIMENT_LOG_TYPE, SERVER_ERROR } from 'ees_types';

export { EXPERIMENT_LOG_TYPE, SERVER_ERROR };

export const NUMBER_OF_LOGS  = 10;

export enum LogType {
  ERROR_LOG = 'Error log',
  AUDIT_LOG = 'Audit log'
}

export enum LogDateFormatType {
  DATE_MONTH = 'dateMonth',
  YEAR_DAY = 'yearDay'
}

export enum AuditLogFilters {
  ALL = 'all',
  EXPERIMENT_CREATED = 'experimentCreated',
  EXPERIMENT_UPDATED = 'experimentUpdated',
  EXPERIMENT_STATE_CHANGED = 'experimentStateChanged',
  EXPERIMENT_DELETED = 'experimentDeleted'
}

export enum ErrorLogFilters {
  ALL = 'all',
  DB_AUTH_FAIL = 'Database auth fail',
  ASSIGNMENT_ERROR = 'Error in the assignment algorithm',
  MISSING_PARAMS = 'Parameter missing in the client request',
  INCORRECT_PARAM_FORMAT = 'Parameter not in the correct format',
  USER_NOT_FOUND = 'User ID not found',
  QUERY_FAILED = 'Query Failed',
  REPORTED_ERROR = 'Error reported from client'
}

export interface AuditLogs {
  id: string;
  createdAt: string;
  updatedAt: string;
  versionNUmber: number;
  type: EXPERIMENT_LOG_TYPE;
  data: any;
}

export interface ErrorLogs {
  id: string;
  createdAt: string;
  updatedAt: string;
  versionNUmber: number;
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
  auditLogFilter: AuditLogFilters;
  errorLogFilter: ErrorLogFilters;
}

export interface State extends AppState {
  logs: LogState;
}
