import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { AuditService } from './audit.service';
import { AuditDataService } from './audit.data.service';
import { auditReducer } from './store/audit.reducer';
import { AuditEffects } from './store/audit.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([AuditEffects]),
    StoreModule.forFeature('audit', auditReducer)
  ],
  providers: [AuditService, AuditDataService]
})
export class AuditModule {}
