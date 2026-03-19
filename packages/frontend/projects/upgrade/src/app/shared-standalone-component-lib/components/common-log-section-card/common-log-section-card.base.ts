import { Directive, Input, OnInit, OnDestroy } from '@angular/core';
import {
  FilterOption,
  CommonSearchWidgetSearchParams,
} from '../common-section-card-search-header/common-section-card-search-header.component';
import { AuditLogTimelineConfig } from '../common-audit-log-timeline/common-audit-log-timeline-config.model';
import { LOG_TYPE } from 'upgrade_types';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { groupBy } from 'lodash';
import { AuditLogs, LogDateFormatType } from '../../../core/logs/store/logs.model';

@Directive()
export abstract class CommonLogSectionCardBase implements OnInit, OnDestroy {
  @Input() isSectionCardExpanded = true;

  // Search state
  searchString$ = new BehaviorSubject<string>('');
  searchKey$ = new BehaviorSubject<string>('All');
  filterOptions$ = new BehaviorSubject<FilterOption[]>([{ value: 'All' }]);

  // Logs data
  entityLogs$: Observable<AuditLogs[]>;
  timelineDataSource$: Observable<{ dates: string[]; dateGroups: Record<string, AuditLogs[]> }>;
  isLoading$: Observable<boolean>;
  allLogsFetched$: Observable<boolean>;

  protected destroy$ = new Subject<void>();
  protected currentEntityId: string | null = null;
  private hasDoneInitialFetch = false;

  LogDateFormatType = LogDateFormatType;

  abstract timelineConfig: AuditLogTimelineConfig;
  abstract get selectedEntity$(): Observable<{ id?: string }>;
  abstract fetchLogs(id: string, isInitial?: boolean): void;
  abstract getLogsById(id: string): Observable<AuditLogs[]>;
  abstract getLogsLoadingState(id: string): Observable<boolean>;
  abstract isAllEntityLogsFetched(id: string): Observable<boolean>;

  ngOnInit(): void {
    this.selectedEntity$
      .pipe(
        filter((entity): entity is { id: string } => !!entity?.id && !this.hasDoneInitialFetch),
        tap((entity) => {
          this.currentEntityId = entity.id;
          this.fetchLogs(entity.id, true);
          this.hasDoneInitialFetch = true;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.entityLogs$ = this.selectedEntity$.pipe(
      filter((entity): entity is { id: string } => !!entity?.id),
      switchMap((entity) => this.getLogsById(entity.id)),
      tap((logs) => this.buildFilterOptions(logs)),
      takeUntil(this.destroy$)
    );

    this.isLoading$ = this.selectedEntity$.pipe(
      filter((entity): entity is { id: string } => !!entity?.id),
      switchMap((entity) => this.getLogsLoadingState(entity.id)),
      takeUntil(this.destroy$)
    );

    this.allLogsFetched$ = this.selectedEntity$.pipe(
      filter((entity): entity is { id: string } => !!entity?.id),
      switchMap((entity) => this.isAllEntityLogsFetched(entity.id)),
      takeUntil(this.destroy$)
    );

    // TODO: prefer doing this on backend
    this.timelineDataSource$ = combineLatest([this.entityLogs$, this.searchString$, this.searchKey$]).pipe(
      map(([logs, searchString, searchKey]) => {
        const filtered = this.filterLogs(logs, searchString, searchKey);
        const dateGroups = this.groupLogsByDate(filtered);
        return { dates: Object.keys(dateGroups), dateGroups };
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
    if (!this.currentEntityId) return;

    combineLatest([this.allLogsFetched$, this.isLoading$])
      .pipe(
        take(1),
        filter(([allFetched, isLoading]) => !allFetched && !isLoading),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.fetchLogs(this.currentEntityId));
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

  // TODO: prefer doing this on backend
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
