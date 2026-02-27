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
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Experiment } from '../../../../../../../core/experiments/store/experiments.model';
import { LogsService } from '../../../../../../../core/logs/logs.service';
import { SharedModule } from '../../../../../../../shared/shared.module';
import { ExperimentLogsTimelineComponent } from './experiment-logs-timeline/experiment-logs-timeline.component';
import { LogDateFormatPipe } from './pipes/log-date-format.pipe';
import { AuditLogs, LogDateFormatType } from '../../../../../../../core/logs/store/logs.model';
import { LOG_TYPE } from 'upgrade_types';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { combineLatest, Subject, Observable, BehaviorSubject } from 'rxjs';
import { map, filter, takeUntil, switchMap, tap, take } from 'rxjs/operators';
import { groupBy } from 'lodash';

/**
 * Section card component for displaying experiment-specific audit logs in a timeline format.
 * Features:
 * - Dynamic filter dropdown with action types and users from logs
 * - Text search capability
 * - Timeline view grouped by date
 * - Infinite scroll pagination
 */
@Component({
  selector: 'app-experiment-log-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardSearchHeaderComponent,
    TranslateModule,
    SharedModule,
    ExperimentLogsTimelineComponent,
    LogDateFormatPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './experiment-log-section-card.component.html',
  styleUrl: './experiment-log-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentLogSectionCardComponent implements OnInit, OnDestroy {
  @Input() isSectionCardExpanded = true;

  selectedExperiment$: Observable<Experiment> = this.experimentService.selectedExperiment$;

  // Search state
  searchString$ = new BehaviorSubject<string>('');
  searchKey$ = new BehaviorSubject<string>('All');
  filterOptions$ = new BehaviorSubject<FilterOption[]>([{ value: 'All' }]);

  // Logs data
  experimentLogs$: Observable<AuditLogs[]>;
  timelineDataSource$: Observable<{ dates: string[]; dateGroups: Record<string, AuditLogs[]> }>;
  isLoading$: Observable<boolean>;
  allLogsFetched$: Observable<boolean>;

  private destroy$ = new Subject<void>();
  private currentExperimentId: string | null = null;

  LogDateFormatType = LogDateFormatType;

  constructor(private readonly experimentService: ExperimentService, private readonly logsService: LogsService) {}

  ngOnInit(): void {
    // Fetch logs when experiment loads
    this.selectedExperiment$
      .pipe(
        filter((exp): exp is Experiment => !!exp),
        tap((exp) => {
          this.currentExperimentId = exp.id;
          this.logsService.fetchExperimentLogs(exp.id, true);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Get raw logs observable
    this.experimentLogs$ = this.selectedExperiment$.pipe(
      filter((exp): exp is Experiment => !!exp),
      switchMap((exp) => this.logsService.fetchExperimentLogsById(exp.id)),
      tap((logs) => {
        this.buildFilterOptions(logs);
      }),
      takeUntil(this.destroy$)
    );

    // Get loading state
    this.isLoading$ = this.selectedExperiment$.pipe(
      switchMap((exp) => this.logsService.getExperimentLogsLoadingState(exp.id)),
      takeUntil(this.destroy$)
    );

    // Get pagination state
    this.allLogsFetched$ = this.selectedExperiment$.pipe(
      switchMap((exp) => this.logsService.isAllExperimentLogsFetched(exp.id)),
      takeUntil(this.destroy$)
    );

    // Apply search and group by date
    // TODO: prefer doing this on backend
    this.timelineDataSource$ = combineLatest([this.experimentLogs$, this.searchString$, this.searchKey$]).pipe(
      map(([logs, searchString, searchKey]) => {
        // TODO: prefer doing this on backend
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
    if (!this.currentExperimentId) return;

    // Check if all logs are fetched and fetch if needed
    this.allLogsFetched$
      .pipe(
        take(1),
        filter((allFetched) => !allFetched),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.logsService.fetchExperimentLogs(this.currentExperimentId);
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

    // Get unique action types (only experiment-related)
    const experimentLogTypes = [
      LOG_TYPE.EXPERIMENT_CREATED,
      LOG_TYPE.EXPERIMENT_UPDATED,
      LOG_TYPE.EXPERIMENT_STATE_CHANGED,
      LOG_TYPE.EXPERIMENT_DELETED,
      LOG_TYPE.EXPERIMENT_DATA_EXPORTED,
      LOG_TYPE.EXPERIMENT_DESIGN_EXPORTED,
    ];

    const actionTypes = [...new Set(logs.map((log) => log.type))].filter((type) => experimentLogTypes.includes(type));

    // Get unique users (firstName + lastName)
    const userSet = new Set<string>();
    logs.forEach((log) => {
      if (log.user?.firstName && log.user?.lastName) {
        userSet.add(`${log.user.firstName} ${log.user.lastName}`);
      }
    });
    const users = Array.from(userSet);

    // Build grouped filter options
    const options: FilterOption[] = [
      { value: 'All' }, // Standalone option
      ...actionTypes.map((type) => ({
        value: type,
        group: 'Event Type', // Group name
      })),
    ];

    if (users.length > 0) {
      users.forEach((user) => {
        options.push({ value: user, group: 'Users' }); // Group name
      });
    }

    this.filterOptions$.next(options);
  }

  /**
   * Filter logs based on search criteria
   */
  private filterLogs(logs: AuditLogs[], searchString: string, searchKey: string): AuditLogs[] {
    let filtered = logs;

    // Apply dropdown filter
    if (searchKey && searchKey !== 'All') {
      // Check if it's an action type
      if (Object.values(LOG_TYPE).includes(searchKey as LOG_TYPE)) {
        filtered = filtered.filter((log) => log.type === searchKey);
      }
      // Check if it's a user name
      else {
        filtered = filtered.filter((log) => {
          const userName = `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim();
          return userName === searchKey;
        });
      }
    }

    // Apply text search
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
