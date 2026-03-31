import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { LogsService } from '../../../../../../core/logs/logs.service';
import { AuditLogs } from '../../../../../../core/logs/store/logs.model';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../shared-standalone-component-lib/components';
import { CommonAuditLogTimelineComponent } from '../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline.component';
import { CommonLogSectionCardBase } from '../../../../../../shared-standalone-component-lib/components/common-log-section-card/common-log-section-card.base';
import { GLOBAL_AUDIT_LOG_TIMELINE_CONFIG } from '../../../global-logs-audit-log-timeline.config';
import { AuditLogTimelineConfig } from '../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline-config.model';

@Component({
  selector: 'app-global-logs-audit-log-section-card',
  styleUrls: ['./global-logs-audit-log-section-card.component.scss'],
  template: ` <app-common-section-card>
    <app-common-section-card-search-header
      header-left
      [filterOptions]="(filterOptions$ | async) || []"
      [searchString]="(searchString$ | async) || ''"
      [searchKey]="(searchKey$ | async) || 'All'"
      (search)="onSearch($event)"
    >
    </app-common-section-card-search-header>
    <app-common-section-card-action-buttons
      header-right
      [showPrimaryButton]="false"
      [isSectionCardExpanded]="isSectionCardExpanded"
      (sectionCardExpandChange)="onSectionCardExpandChange($event)"
    >
    </app-common-section-card-action-buttons>
    @if (isSectionCardExpanded) {
    <ng-container content>
      <common-audit-log-timeline
        [groupedLogs]="timelineDataSource$ | async"
        [isLoading]="isLoading$ | async"
        [isEmpty]="(entityLogs$ | async)?.length === 0"
        [config]="timelineConfig"
        (scrolledToBottom)="fetchLogsOnScroll()"
      >
      </common-audit-log-timeline>
    </ng-container>
    }
  </app-common-section-card>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonAuditLogTimelineComponent,
  ],
})
export class GlobalLogsAuditLogSectionCardComponent extends CommonLogSectionCardBase {
  timelineConfig: AuditLogTimelineConfig = GLOBAL_AUDIT_LOG_TIMELINE_CONFIG;

  get selectedEntity$(): Observable<{ id: string }> {
    return of({ id: 'global' });
  }

  constructor(private readonly logsService: LogsService) {
    super();
  }

  fetchLogs(_id: string, isInitial?: boolean): void {
    this.logsService.fetchAuditLogs(isInitial);
  }

  getLogsById(_id: string): Observable<AuditLogs[]> {
    return this.logsService
      .getAuditLogs()
      .pipe(
        map((logs) => [...logs].sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0)))
      );
  }

  getLogsLoadingState(_id: string): Observable<boolean> {
    return this.logsService.isAuditLogLoading$;
  }

  isAllEntityLogsFetched(_id: string): Observable<boolean> {
    return this.logsService.isAllAuditLogsFetched();
  }

  override ngOnDestroy(): void {
    this.logsService.setAuditLogFilter(null);
    super.ngOnDestroy();
  }
}
