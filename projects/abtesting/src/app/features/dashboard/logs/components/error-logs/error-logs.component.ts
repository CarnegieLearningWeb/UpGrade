import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LogType, ErrorLogs, LogDateFormatType, SERVER_ERROR } from '../../../../../core/logs/store/logs.model';
import { LogsService } from '../../../../../core/logs/logs.service';
import * as groupBy from 'lodash.groupby';
import { KeyValue } from '@angular/common';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'error-logs',
  templateUrl: './error-logs.component.html',
  styleUrls: ['./error-logs.component.scss']
})
export class ErrorLogsComponent implements OnInit, OnDestroy, AfterViewInit {
  errorLogData: any;
  errorLogSubscription: Subscription;
  searchValue: string;
  logsOptions = [
    { value: 'all', viewValue: 'All' },
    { value: SERVER_ERROR.DB_AUTH_FAIL, viewValue: SERVER_ERROR.DB_AUTH_FAIL },
    { value: SERVER_ERROR.ASSIGNMENT_ERROR, viewValue: SERVER_ERROR.ASSIGNMENT_ERROR },
    { value: SERVER_ERROR.MISSING_PARAMS, viewValue: SERVER_ERROR.MISSING_PARAMS },
    { value: SERVER_ERROR.INCORRECT_PARAM_FORMAT, viewValue: SERVER_ERROR.INCORRECT_PARAM_FORMAT },
    { value: SERVER_ERROR.USER_NOT_FOUND, viewValue: SERVER_ERROR.USER_NOT_FOUND },
    { value: SERVER_ERROR.QUERY_FAILED, viewValue: SERVER_ERROR.QUERY_FAILED },
    { value: SERVER_ERROR.REPORTED_ERROR, viewValue: SERVER_ERROR.REPORTED_ERROR },
    { value: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED, viewValue: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED },
    { value: SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED, viewValue: SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED },
    { value: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP, viewValue: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP },
  ];
  selectedLogOption = this.logsOptions[0].value;
  isErrorLogLoading$ = this.logsService.isErrorLogLoading$;
  @ViewChild('ErrorLogContainer', { static: false }) errorLogContainer: ElementRef;

  constructor(private logsService: LogsService) {}

  ngOnInit() {
    this.errorLogSubscription = this.logsService.getAllErrorLogs$.subscribe(errorLogs => {
      errorLogs.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
      this.errorLogData = groupBy(errorLogs, log => {
        const date = new Date(log.createdAt);
        return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
      });
    });
  }

  ngOnDestroy() {
    this.errorLogSubscription.unsubscribe();
  }

  // Used for keyvalue pipe to sort data by key
  valueDescOrder = (a: KeyValue<string, ErrorLogs>, b: KeyValue<string, ErrorLogs>) => {
    if (new Date(a.key).getTime() < new Date(b.key).getTime()) {
      return b.key;
    }
  };

  changeLogOption(value: any) {
    value = value === 'all' ? null : value
    this.logsService.setErrorLogFilter(value);
  }

  get LogType() {
    return LogType;
  }

  get LogDateFormatTypes() {
    return LogDateFormatType;
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.errorLogContainer.nativeElement.style.height = (windowHeight - 350) + 'px';
    fromEvent(this.errorLogContainer.nativeElement, 'scroll').pipe(debounceTime(500)).subscribe(value => {
      const height = this.errorLogContainer.nativeElement.clientHeight;
      const scrollHeight = this.errorLogContainer.nativeElement.scrollHeight - height;
      const scrollTop = this.errorLogContainer.nativeElement.scrollTop;
      const percent = Math.floor(scrollTop / scrollHeight * 100);
      if (percent > 80) {
        this.logsService.fetchErrorLogs();
      }
    });
  }
}
