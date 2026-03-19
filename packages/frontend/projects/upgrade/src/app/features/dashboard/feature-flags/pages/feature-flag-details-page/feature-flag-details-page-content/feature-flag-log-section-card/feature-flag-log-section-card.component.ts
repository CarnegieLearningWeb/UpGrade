import { ChangeDetectionStrategy, Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import {
  FilterOption,
  CommonSearchWidgetSearchParams,
} from '../../../../../../../shared-standalone-component-lib/components/common-section-card-search-header/common-section-card-search-header.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { LogsService } from '../../../../../../../core/logs/logs.service';
import { SharedModule } from '../../../../../../../shared/shared.module';
import { CommonAuditLogTimelineComponent } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline.component';
import { AuditLogs, LogDateFormatType } from '../../../../../../../core/logs/store/logs.model';
import { LOG_TYPE } from 'upgrade_types';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { combineLatest, Subject, Observable, BehaviorSubject } from 'rxjs';
import { map, filter, takeUntil, switchMap, tap, take } from 'rxjs/operators';
import { groupBy } from 'lodash';
import { AuditLogTimelineConfig } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/common-audit-log-timeline-config.model';
import { FEATURE_FLAG_TIMELINE_LOG_TYPE_CONFIG } from '../../../../../../../shared-standalone-component-lib/components/common-audit-log-timeline/configs/feature-flag-timeline.config';

/**
 * Section card component for displaying feature flag-specific audit logs in a timeline format.
 * Features:
 * - Dynamic filter dropdown with action types and users from logs
 * - Text search capability
 * - Timeline view grouped by date
 * - Infinite scroll pagination
 */
@Component({
  selector: 'app-feature-flag-log-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardSearchHeaderComponent,
    TranslateModule,
    SharedModule,
    CommonAuditLogTimelineComponent,
    MatProgressSpinnerModule,
  ],
  standalone: true,
  templateUrl: './feature-flag-log-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagLogSectionCardComponent implements OnInit, OnDestroy {
  @Input() isSectionCardExpanded = true;

  selectedFeatureFlag$: Observable<FeatureFlag> = this.featureFlagsService.selectedFeatureFlag$;

  // Search state
  searchString$ = new BehaviorSubject<string>('');
  searchKey$ = new BehaviorSubject<string>('All');
  filterOptions$ = new BehaviorSubject<FilterOption[]>([{ value: 'All' }]);

  // Logs data
  featureFlagLogs$: Observable<AuditLogs[]>;
  timelineDataSource$: Observable<{ dates: string[]; dateGroups: Record<string, AuditLogs[]> }>;
  isLoading$: Observable<boolean>;
  allLogsFetched$: Observable<boolean>;

  private destroy$ = new Subject<void>();
  private currentFlagId: string | null = null;
  private hasDoneIntialFetch = false;

  LogDateFormatType = LogDateFormatType;
  timelineConfig: AuditLogTimelineConfig = FEATURE_FLAG_TIMELINE_LOG_TYPE_CONFIG;

  constructor(private readonly featureFlagsService: FeatureFlagsService, private readonly logsService: LogsService) {}

  ngOnInit(): void {
    // Fetch logs when feature flag loads
    this.selectedFeatureFlag$
      .pipe(
        filter((flag): flag is FeatureFlag => !!flag && !this.hasDoneIntialFetch),
        tap((flag) => {
          this.currentFlagId = flag.id;
          this.logsService.fetchFeatureFlagLogs(flag.id, true);
          this.hasDoneIntialFetch = true;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Get raw logs observable
    this.featureFlagLogs$ = this.selectedFeatureFlag$.pipe(
      filter((flag): flag is FeatureFlag => !!flag),
      switchMap((flag) => this.logsService.getFeatureFlagLogsById(flag.id)),
      tap((logs) => {
        this.buildFilterOptions(logs);
      }),
      takeUntil(this.destroy$)
    );

    // Get loading state
    this.isLoading$ = this.selectedFeatureFlag$.pipe(
      filter((flag): flag is FeatureFlag => !!flag),
      switchMap((flag) => this.logsService.getFeatureFlagLogsLoadingState(flag.id)),
      takeUntil(this.destroy$)
    );

    // Get pagination state
    this.allLogsFetched$ = this.selectedFeatureFlag$.pipe(
      filter((flag): flag is FeatureFlag => !!flag),
      switchMap((flag) => this.logsService.isAllFeatureFlagLogsFetched(flag.id)),
      takeUntil(this.destroy$)
    );

    // Apply search and group by date
    // TODO: prefer doing this on backend
    this.timelineDataSource$ = combineLatest([this.featureFlagLogs$, this.searchString$, this.searchKey$]).pipe(
      map(([logs, searchString, searchKey]) => {
        const filtered = this.filterLogs(logs, searchString, searchKey);
        const dateGroups = this.groupLogsByDate(filtered);
        const dates = Object.keys(dateGroups);
        return {
          dates,
          dateGroups,
        };
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
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
    if (!this.currentFlagId) return;

    combineLatest([this.allLogsFetched$, this.isLoading$])
      .pipe(
        take(1),
        filter(([allFetched, isLoading]) => !allFetched && !isLoading),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.logsService.fetchFeatureFlagLogs(this.currentFlagId);
      });
  }

  /**
   * Build dynamic filter options from logs data
   */
  private buildFilterOptions(logs: AuditLogs[]): void {
    if (!logs || logs.length === 0) {
      this.filterOptions$.next([{ value: 'All' }]);
      return;
    }

    const featureFlagLogTypes = [
      LOG_TYPE.FEATURE_FLAG_CREATED,
      LOG_TYPE.FEATURE_FLAG_UPDATED,
      LOG_TYPE.FEATURE_FLAG_STATUS_CHANGED,
      LOG_TYPE.FEATURE_FLAG_DELETED,
      LOG_TYPE.FEATURE_FLAG_DATA_EXPORTED,
      LOG_TYPE.FEATURE_FLAG_DESIGN_EXPORTED,
    ];

    const actionTypes = [...new Set(logs.map((log) => log.type))].filter((type) => featureFlagLogTypes.includes(type));

    const userSet = new Set<string>();
    logs.forEach((log) => {
      if (log.user?.firstName && log.user?.lastName) {
        userSet.add(`${log.user.firstName} ${log.user.lastName}`);
      }
    });
    const users = Array.from(userSet);

    const options: FilterOption[] = [
      { value: 'All' },
      ...actionTypes.map((type) => ({
        value: type,
        group: 'Event Type',
      })),
    ];

    if (users.length > 0) {
      users.forEach((user) => {
        options.push({ value: user, group: 'Users' });
      });
    }

    this.filterOptions$.next(options);
  }

  /**
   * Filter logs based on search criteria
   */
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

  /**
   * Group logs by date (format: YYYY/M/D)
   */
  private groupLogsByDate(logs: AuditLogs[]): Record<string, AuditLogs[]> {
    return groupBy(logs, (log) => {
      const date = new Date(log.createdAt);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    });
  }
}
