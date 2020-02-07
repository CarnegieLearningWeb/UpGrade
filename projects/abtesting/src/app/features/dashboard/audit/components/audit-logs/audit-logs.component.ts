import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { LogType, LogDateFormatType, Audit } from '../../../../../core/audit/store/audit.model';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogsComponent {

  @Input() auditLogData: Audit[];
  searchValue: string;
  logsOptions = [
    { value: 'Showing all Activities', viewValue: 'Showing all Activities' },
  ];
  selectedLogOption = this.logsOptions[0].value;

  searchLogs(value: string) {}

  changeLogOption(value: string) {}

  // Used for keyvalue pipe to sort data by key
  valueDescOrder = (a: KeyValue<string, Audit>, b: KeyValue<string, Audit>): number => {
    return  new Date(a.key).getTime() > new Date(b.key).getTime() ? 1 : 0;
  }

  get LogType() {
    return LogType;
  }

  get LogDateFormatTypes() {
    return LogDateFormatType;
  }
}
