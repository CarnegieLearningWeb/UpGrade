import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  LogType,
  LogDateFormatType,
  Audit
} from '../../../../../core/audit/store/audit.model';
import { KeyValue } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuditService } from '../../../../../core/audit/audit.service';
import * as groupBy from 'lodash.groupby';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  auditLogData: any;
  logsSubscription: Subscription;
  searchValue: string;
  logsOptions = [
    { value: 'Showing all Activities', viewValue: 'Showing all Activities' }
  ];
  selectedLogOption = this.logsOptions[0].value;
  isAuditLoading$ = this.auditService.isAuditLoading$;

  constructor(private auditService: AuditService) {}

  ngOnInit() {
    this.logsSubscription = this.auditService.getAuditLogs().subscribe(logs => {
      logs.sort((a, b) =>
        a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0
      );
      this.auditLogData = groupBy(logs, log => {
        const date = new Date(log.createdAt);
        return (
          date.getFullYear() +
          '-' +
          (date.getMonth() + 1) +
          '-' +
          date.getDate()
        );
      });
    });
  }

  ngOnDestroy() {
    this.logsSubscription.unsubscribe();
  }

  searchLogs(value: string) {}

  changeLogOption(value: string) {}

  // Used for keyvalue pipe to sort data by key
  valueDescOrder = (a: KeyValue<string, Audit>, b: KeyValue<string, Audit>): number => {
    return new Date(a.key).getTime() > new Date(b.key).getTime() ? 1 : 0;
  };

  get LogType() {
    return LogType;
  }

  get LogDateFormatTypes() {
    return LogDateFormatType;
  }
}
