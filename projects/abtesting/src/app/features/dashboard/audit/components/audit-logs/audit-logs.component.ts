import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LogType } from '../../../../../core/audit/store/audit.model';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogsComponent {

  searchValue: string;
  logsOptions = [
    { value: 'Showing all Activities', viewValue: 'Showing all Activities' },
  ];
  selectedLogOption = this.logsOptions[0].value;

  auditLogData = [
    {
      createdAt: new Date().toISOString(),
      value: 'John Doe',
      message: 'successfully logged into Salesforce System part of the Department of Defence'
    },
    {
      createdAt: new Date().toISOString(),
      value: 'Samantha',
      message: 'successfully logged into DataDog System part of the Department of Defence'
    },
    {
      createdAt: new Date().toISOString(),
      value: 'You',
      message: 'accessed the Experiment page'
    },
    {
      createdAt: new Date().toISOString(),
      value: 'John Doe',
      message: 'successfully create Experiment 3'
    },
    {
      createdAt: new Date().toISOString(),
      value: 'Samantha',
      message: 'successfully logged into DataDog System part of the Department of Defence'
    },
  ];

  searchLogs(value: string) {}

  changeLogOption(value: string) {}

  get LogType() {
    return LogType;
  }
}
