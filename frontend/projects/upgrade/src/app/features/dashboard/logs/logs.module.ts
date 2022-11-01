import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../../shared/shared.module';

import { ErrorLogsComponent } from './components/error-logs/error-logs.component';
import { AuditLogsComponent } from './components/audit-logs/audit-logs.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { ErrorLogPipe } from './pipes/error-log.pipe';
import { LogDateFormatPipe } from './pipes/logs-date-format.pipe';
import { ExperimentActionMessage } from './pipes/experiment-action-message.pipe';
import { LogsComponent } from './root/logs.component';
import { LogsRoutingModule } from './logs-routing.module';

@NgModule({
  declarations: [
    LogsComponent,
    ErrorLogsComponent,
    AuditLogsComponent,
    TimelineComponent,
    ErrorLogPipe,
    LogDateFormatPipe,
    ExperimentActionMessage,
  ],
  imports: [CommonModule, SharedModule, LogsRoutingModule],
})
export class LogsModule {}
