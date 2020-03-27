import { Component, OnInit, OnDestroy } from '@angular/core';
import { LogsService } from '../../../../core/logs/logs.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  constructor(private logsService: LogsService) {}

  ngOnInit() {
    this.logsService.fetchAuditLogs(true);
    this.logsService.fetchErrorLogs(true);
  }

  ngOnDestroy() {
    this.logsService.setAuditLogFilter(null);
    this.logsService.setErrorLogFilter(null);
  }
}
