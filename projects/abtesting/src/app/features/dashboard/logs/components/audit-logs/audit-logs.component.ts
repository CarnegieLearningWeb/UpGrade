import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LogType, LogDateFormatType, AuditLogs, AuditLogFilters } from '../../../../../core/logs/store/logs.model';
import { KeyValue } from '@angular/common';
import { Subscription, fromEvent } from 'rxjs';
import { LogsService } from '../../../../../core/logs/logs.service';
import * as groupBy from 'lodash.groupby';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit, OnDestroy, AfterViewInit {
  auditLogData: any;
  auditLogsSubscription: Subscription;
  searchValue: string;
  logsOptions = [
    { value: AuditLogFilters.ALL, viewValue: 'All' },
    { value: AuditLogFilters.EXPERIMENT_CREATED, viewValue: 'Created' },
    { value: AuditLogFilters.EXPERIMENT_UPDATED, viewValue: 'Updated' },
    { value: AuditLogFilters.EXPERIMENT_STATE_CHANGED, viewValue: 'State changed' },
    { value: AuditLogFilters.EXPERIMENT_DELETED, viewValue: 'Deleted' }
  ];
  selectedLogOption = this.logsOptions[0].value;
  isAuditLoading$ = this.logsService.isAuditLogLoading$;
  @ViewChild('auditLogContainer', { static: false }) auditLogContainer: ElementRef;

  constructor(private logsService: LogsService) {}

  ngOnInit() {
    this.auditLogsSubscription = this.logsService.getAuditLogs().subscribe(logs => {
      logs.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
      this.auditLogData = groupBy(logs, log => {
        const date = new Date(log.createdAt);
        return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
      });
    });
  }

  ngOnDestroy() {
    this.auditLogsSubscription.unsubscribe();
  }

  changeLogOption(value: AuditLogFilters) {
    this.logsService.setAuditLogFilter(value);
  }

  // Used for keyvalue pipe to sort data by key
  valueDescOrder = (a: KeyValue<string, AuditLogs>, b: KeyValue<string, AuditLogs>): number => {
    return new Date(a.key).getTime() > new Date(b.key).getTime() ? 1 : 0;
  };

  get LogType() {
    return LogType;
  }

  get LogDateFormatTypes() {
    return LogDateFormatType;
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.auditLogContainer.nativeElement.style.height = (windowHeight - 350) + 'px';
    fromEvent(this.auditLogContainer.nativeElement, 'scroll').pipe(debounceTime(500)).subscribe(value => {
      const height = this.auditLogContainer.nativeElement.clientHeight;
      const scrollHeight = this.auditLogContainer.nativeElement.scrollHeight - height;
      const scrollTop = this.auditLogContainer.nativeElement.scrollTop;
      const percent = Math.floor(scrollTop / scrollHeight * 100);
      if (percent > 80) {
        this.logsService.fetchAuditLogs();
      }
    });
  }
}
