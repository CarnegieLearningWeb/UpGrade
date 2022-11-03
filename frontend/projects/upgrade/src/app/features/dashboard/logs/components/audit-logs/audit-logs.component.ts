import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LogType, LogDateFormatType, AuditLogs } from '../../../../../core/logs/store/logs.model';
import { KeyValue } from '@angular/common';
import { Subscription } from 'rxjs';
import { LogsService } from '../../../../../core/logs/logs.service';
import * as groupBy from 'lodash.groupby';
import { SettingsService } from '../../../../../core/settings/settings.service';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
})
export class AuditLogsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('auditLogContainer') auditLogContainer: ElementRef;
  auditLogData: any;
  auditLogsSubscription: Subscription;
  isAllAuditLogFetched = false;
  isAllAuditLogFetchedSub: Subscription;
  isAuditLoading$ = this.logsService.isAuditLogLoading$;
  theme$ = this.settingsService.theme$;

  constructor(private logsService: LogsService, private settingsService: SettingsService) {}

  get LogType() {
    return LogType;
  }

  get LogDateFormatTypes() {
    return LogDateFormatType;
  }

  ngOnInit() {
    this.auditLogsSubscription = this.logsService.getAuditLogs().subscribe((logs) => {
      logs.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
      this.auditLogData = groupBy(logs, (log) => {
        const date = new Date(log.createdAt);
        return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
      });
    });

    this.isAllAuditLogFetchedSub = this.logsService
      .isAllAuditLogsFetched()
      .subscribe((value) => (this.isAllAuditLogFetched = value));
  }

  // Used for keyvalue pipe to sort data by key
  valueDescOrder = (a: KeyValue<string, AuditLogs>, b: KeyValue<string, AuditLogs>) => {
    if (new Date(a.key).getTime() < new Date(b.key).getTime()) {
      return b.key;
    }
  };

  fetchAuditLogOnScroll() {
    if (!this.isAllAuditLogFetched) {
      this.logsService.fetchAuditLogs();
    }
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.auditLogContainer.nativeElement.style.height = windowHeight - 325 + 'px';
  }

  ngOnDestroy() {
    this.auditLogsSubscription.unsubscribe();
    this.isAllAuditLogFetchedSub.unsubscribe();
  }
}
