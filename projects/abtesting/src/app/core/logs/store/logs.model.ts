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
}

export interface State extends AppState {
  logs: LogState;
}
