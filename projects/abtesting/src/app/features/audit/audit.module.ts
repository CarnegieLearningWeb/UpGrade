import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { AuditComponent } from './root/audit.component';
import { AuditRoutingModule } from './audit-routing.module';
import { ErrorLogsComponent } from './components/error-logs/error-logs.component';
import { AuditLogsComponent } from './components/audit-logs/audit-logs.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { ErrorLogPipe } from './pipes/error-log.pipe';

@NgModule({
  declarations: [
    AuditComponent,
    ErrorLogsComponent,
    AuditLogsComponent,
    TimelineComponent,
    ErrorLogPipe
  ],
  imports: [CommonModule, SharedModule, AuditRoutingModule]
})
export class AuditModule {}
