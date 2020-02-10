import { AppState } from '../../core.module';
import { EntityState } from '@ngrx/entity';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';

export {
  EXPERIMENT_LOG_TYPE
};


export enum LogType {
  ERROR_LOG = 'Error log',
  AUDIT_LOG = 'Audit log'
}

export enum LogDateFormatType {
  DATE_MONTH = 'dateMonth',
  YEAR_DAY = 'yearDay'
}

// TODO: Will be removed after verifying available error log types
export enum ErrorLogTypes {
  SERVER_NOT_REACHABLE = 'Server not reachable',
  DATABASE_AUTH_FAIL = 'Database auth fail',
  DATABASE_NOT_REACHABLE = 'Database not reachable',
  USER_ID_NOT_FOUND = 'User ID not found',
  ERROR_IN_ASSIGNMENT_ALGORITHM = 'Error in the assignment algorithm'
}

// TODO: Will be removed after verifying available error log types
export enum ErrorLogMessages {
  SERVER_NOT_REACHABLE = 'The server is down and cannot be reached after a specific number of retries',
  DATABASE_AUTH_FAIL = 'the database responded with auth error',
  DATABASE_NOT_REACHABLE = 'The server application cannot connect to the database that has all of the experiments',
  USER_ID_NOT_FOUND = 'Not found in the internal-external user ID map',
  ERROR_IN_ASSIGNMENT_ALGORITHM = 'The assignment function cannot assign a user to a condition due to some error in the assignment algorithm'
}

export interface Audit {
  id: string;
  createdAt: string;
  updatedAt: string;
  versionNUmber: number;
  type: EXPERIMENT_LOG_TYPE
  data: any
}

export interface AuditState extends EntityState<Audit> {
  isAuditLoading: boolean;
}

export interface State extends AppState {
  audit: AuditState;
}
