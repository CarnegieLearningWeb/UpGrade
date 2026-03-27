import { Component } from '@angular/core';
import {
  CommonPageComponent,
  CommonRootPageHeaderComponent,
  CommonSectionCardListComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { LogsAuditLogSectionCardComponent } from './logs-audit-log-section-card/logs-audit-log-section-card.component';

@Component({
  selector: 'app-logs-root-page',
  template: `
    <app-common-page>
      <!-- header -->
      <app-common-root-page-header title="logs.main-heading.text" subtitle="logs.sub-heading.text" header>
      </app-common-root-page-header>
      <!-- content -->
      <app-common-section-card-list content>
        <app-logs-audit-log-section-card section-card></app-logs-audit-log-section-card>
      </app-common-section-card-list>
    </app-common-page>
  `,
  standalone: true,
  imports: [
    CommonPageComponent,
    CommonRootPageHeaderComponent,
    CommonSectionCardListComponent,
    LogsAuditLogSectionCardComponent,
  ],
})
export class LogsRootPageComponent {}
