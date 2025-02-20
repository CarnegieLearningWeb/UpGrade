import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { LogType, ErrorLogs, LogDateFormatType } from '../../../../../core/logs/store/logs.model';
import { LogsService } from '../../../../../core/logs/logs.service';
import groupBy from 'lodash/groupBy';
import { KeyValue } from '@angular/common';
import { Subscription } from 'rxjs';
import { SettingsService } from '../../../../../core/settings/settings.service';
import { ENV, Environment } from '../../../../../../environments/environment-types';

@Component({
  selector: 'error-logs',
  templateUrl: './error-logs.component.html',
  styleUrls: ['./error-logs.component.scss'],
  standalone: false,
})
export class ErrorLogsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('ErrorLogContainer') errorLogContainer: ElementRef;
  errorLogData: any;
  errorLogSubscription: Subscription;
  isAllErrorLogFetched = false;
  isAllErrorLogFetchedSub: Subscription;
  isErrorLogLoading$ = this.logsService.isErrorLogLoading$;

  constructor(
    private logsService: LogsService,
    private settingsService: SettingsService,
    @Inject(ENV) public environment: Environment
  ) {}

  get LogType() {
    return LogType;
  }

  get LogDateFormatTypes() {
    return LogDateFormatType;
  }

  ngOnInit() {
    this.errorLogSubscription = this.logsService.getAllErrorLogs$.subscribe((errorLogs) => {
      errorLogs.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
      this.errorLogData = groupBy(errorLogs, (log) => {
        const date = new Date(log.createdAt);
        return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
      });
    });
    this.isAllErrorLogFetchedSub = this.logsService
      .isAllErrorLogsFetched()
      .subscribe((value) => (this.isAllErrorLogFetched = value));
  }

  // Used for keyvalue pipe to sort data by key
  valueDescOrder = (a: KeyValue<string, ErrorLogs>, b: KeyValue<string, ErrorLogs>) => {
    if (new Date(a.key).getTime() < new Date(b.key).getTime()) {
      return b.key;
    }
  };

  fetchErrorLogOnScroll() {
    if (!this.isAllErrorLogFetched) {
      this.logsService.fetchErrorLogs();
    }
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.errorLogContainer.nativeElement.style.height = windowHeight - 325 + 'px';
  }

  ngOnDestroy() {
    this.errorLogSubscription.unsubscribe();
    this.isAllErrorLogFetchedSub.unsubscribe();
  }
}
