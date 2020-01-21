import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LogType, ErrorLogTypes, ErrorLogMessages } from '../../../../core/audit/store/audit.model';

@Component({
  selector: 'error-logs',
  templateUrl: './error-logs.component.html',
  styleUrls: ['./error-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorLogsComponent {

  searchValue: string;
  logsOptions = [
    { value: 'Showing all Activities', viewValue: 'Showing all Activities' },
  ];
  selectedLogOption = this.logsOptions[0].value;
  errorLogData = [
    {
      createdAt: new Date().toISOString(),
      value: ErrorLogTypes.SERVER_NOT_REACHABLE,
      message: ErrorLogMessages.SERVER_NOT_REACHABLE
    },
    {
      createdAt: new Date().toISOString(),
      value: ErrorLogTypes.DATABASE_AUTH_FAIL,
      message: ErrorLogMessages.DATABASE_AUTH_FAIL
    },
    {
      createdAt: new Date().toISOString(),
      value: ErrorLogTypes.USER_ID_NOT_FOUND,
      message: ErrorLogMessages.USER_ID_NOT_FOUND
    },
    {
      createdAt: new Date().toISOString(),
      value: ErrorLogTypes.DATABASE_NOT_REACHABLE,
      message: ErrorLogMessages.DATABASE_NOT_REACHABLE
    },
    {
      createdAt: new Date().toISOString(),
      value: ErrorLogTypes.ERROR_IN_ASSIGNMENT_ALGORITHM,
      message: ErrorLogMessages.ERROR_IN_ASSIGNMENT_ALGORITHM
    },
  ];

  searchLogs(value: string) {}

  changeLogOption(value: string) {}

  get LogType() {
    return LogType;
  }
}
