import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, take, takeUntil, tap } from 'rxjs/operators';
import { groupBy } from 'lodash';
import { LOG_TYPE } from 'upgrade_types';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LogsService } from '../../../../../../core/logs/logs.service';
import { AuditLogs } from '../../../../../../core/logs/store/logs.model';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../shared-standalone-component-lib/components';
import { CommonAuditLogTimelineComponent } from '../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline.component';
import { GLOBAL_AUDIT_LOG_TIMELINE_CONFIG } from '../../../logs-audit-log-timeline.config';
import {
  FilterOption,
  CommonSearchWidgetSearchParams,
} from '../../../../../../shared-standalone-component-lib/components/common-section-card-search-header/common-section-card-search-header.component';

@Component({
  selector: 'app-logs-audit-log-section-card',
  templateUrl: './logs-audit-log-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatProgressSpinnerModule,
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonAuditLogTimelineComponent,
  ],
})
export class LogsAuditLogSectionCardComponent implements OnInit, OnDestroy {
  readonly timelineConfig = GLOBAL_AUDIT_LOG_TIMELINE_CONFIG;

  isSectionCardExpanded = true;
  searchString$ = new BehaviorSubject<string>('');
  searchKey$ = new BehaviorSubject<string>('All');
  filterOptions$ = new BehaviorSubject<FilterOption[]>([{ value: 'All' }]);

  isLoading$ = this.logsService.isAuditLogLoading$;
  allLogsFetched$ = this.logsService.isAllAuditLogsFetched();

  private auditLogs$ = this.logsService.getAuditLogs().pipe(tap((logs) => this.buildFilterOptions(logs)));

  timelineDataSource$ = combineLatest([this.auditLogs$, this.searchString$, this.searchKey$]).pipe(
    map(([logs, searchString, searchKey]) => {
      const sorted = [...logs].sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
      const filtered = this.filterLogs(sorted, searchString, searchKey);
      const dateGroups = this.groupLogsByDate(filtered);
      return { dates: Object.keys(dateGroups), dateGroups };
    })
  );

  private destroy$ = new Subject<void>();

  constructor(private readonly logsService: LogsService) {}

  ngOnInit(): void {
    this.logsService.fetchAuditLogs(true);
  }

  ngOnDestroy(): void {
    this.logsService.setAuditLogFilter(null);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  onSearch(params: CommonSearchWidgetSearchParams<string>): void {
    this.searchKey$.next(params.searchKey);
    this.searchString$.next(params.searchString);
  }

  fetchLogsOnScroll(): void {
    combineLatest([this.allLogsFetched$, this.isLoading$])
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(([allFetched, isLoading]) => {
        if (!allFetched && !isLoading) {
          this.logsService.fetchAuditLogs();
        }
      });
  }

  private buildFilterOptions(logs: AuditLogs[]): void {
    if (!logs || logs.length === 0) {
      this.filterOptions$.next([{ value: 'All' }]);
      return;
    }

    const allowedTypes = new Set(Object.keys(this.timelineConfig.logTypeMessageMap));
    const actionTypes = [...new Set(logs.map((log) => log.type))].filter((type) => allowedTypes.has(type));

    const userSet = new Set<string>();
    logs.forEach((log) => {
      if (log.user?.firstName && log.user?.lastName) {
        userSet.add(`${log.user.firstName} ${log.user.lastName}`);
      }
    });

    const options: FilterOption[] = [
      { value: 'All' },
      ...actionTypes.map((type) => ({ value: type, group: 'Event Type' })),
      ...Array.from(userSet).map((user) => ({ value: user, group: 'Users' })),
    ];

    this.filterOptions$.next(options);
  }

  private filterLogs(logs: AuditLogs[], searchString: string, searchKey: string): AuditLogs[] {
    let filtered = logs;

    if (searchKey && searchKey !== 'All') {
      if (Object.values(LOG_TYPE).includes(searchKey as LOG_TYPE)) {
        filtered = filtered.filter((log) => log.type === searchKey);
      } else {
        filtered = filtered.filter((log) => {
          const userName = `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim();
          return userName === searchKey;
        });
      }
    }

    if (searchString) {
      const searchLower = searchString.toLowerCase();
      filtered = filtered.filter((log) => {
        const userName = `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.toLowerCase();
        const actionType = log.type.toLowerCase();
        const dataStr = JSON.stringify(log.data).toLowerCase();
        return userName.includes(searchLower) || actionType.includes(searchLower) || dataStr.includes(searchLower);
      });
    }

    return filtered;
  }

  private groupLogsByDate(logs: AuditLogs[]): Record<string, AuditLogs[]> {
    return groupBy(logs, (log) => {
      const date = new Date(log.createdAt);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    });
  }
}
