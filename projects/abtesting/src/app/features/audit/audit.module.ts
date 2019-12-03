import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { AuditComponent } from './root/audit.component';
import { AuditRoutingModule } from './audit-routing.module';

@NgModule({
  declarations: [AuditComponent],
  imports: [CommonModule, SharedModule, AuditRoutingModule]
})
export class AuditModule {}
