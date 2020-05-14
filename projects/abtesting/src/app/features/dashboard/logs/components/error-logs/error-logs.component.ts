import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LogType, ErrorLogs, LogDateFormatType } from '../../../../../core/logs/store/logs.model';
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
