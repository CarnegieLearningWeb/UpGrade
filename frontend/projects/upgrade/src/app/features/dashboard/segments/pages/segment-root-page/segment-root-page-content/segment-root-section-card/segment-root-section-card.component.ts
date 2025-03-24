import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { SegmentsService } from '../../../../../../../core/segments/segments.service';
import { AsyncPipe, NgIf, TitleCasePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SegmentRootSectionCardTableComponent } from './segment-root-section-card-table/segment-root-section-card-table.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SEGMENT_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';
import { RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Observable, map } from 'rxjs';
import { Segment } from '../../../../../../../core/segments/store/segments.model';
import { CommonSearchWidgetSearchParams } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-search-header/common-section-card-search-header.component';
import {
  CommonTableHelpersService,
  TableState,
} from '../../../../../../../shared/services/common-table-helpers.service';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-segment-root-section-card',
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    SegmentRootSectionCardTableComponent,
    AsyncPipe,
    NgIf,
    MatProgressSpinnerModule,
    RouterModule,
    TranslateModule,
    TitleCasePipe,
  ],
  templateUrl: './segment-root-section-card.component.html',
  styleUrl: './segment-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentRootSectionCardComponent {
  permissions$: Observable<UserPermission>;
  dataSource$: Observable<MatTableDataSource<Segment>>;
  isLoadingSegments$ = this.segmentsService.isLoadingSegments$;
  isInitialLoading$ = this.segmentsService.isInitialSegmentsLoading();
  isAllSegmentsFetched$; // TODO: Implement if needed for pagination
  searchString$ = this.segmentsService.selectSearchString$;
  searchKey$ = this.segmentsService.selectSearchKey$;
  searchParams$ = this.segmentsService.selectSearchSegmentParams();
  selectRootTableState$; // TODO: Implement if needed
  isSearchActive$: Observable<boolean> = this.searchString$.pipe(map((searchString) => !!searchString));

  segmentFilterOptions = [
    SEGMENT_SEARCH_KEY.ALL,
    SEGMENT_SEARCH_KEY.NAME,
    SEGMENT_SEARCH_KEY.CONTEXT,
    SEGMENT_SEARCH_KEY.TAG,
  ];
  isSectionCardExpanded = true;

  menuButtonItems: IMenuButtonItem[] = [
    {
      name: this.translateService.instant('segments.import-segment.text'),
      disabled: false,
    },
    {
      name: this.translateService.instant('segments.export-all-segments.text'),
      disabled: true,
    },
  ];

  constructor(
    private segmentsService: SegmentsService,
    private translateService: TranslateService,
    private dialogService: DialogService,
    private tableHelpersService: CommonTableHelpersService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.segmentsService.fetchSegments(true);
  }

  ngAfterViewInit() {
    // Initialize dataSource$ with segments data
    this.dataSource$ = this.segmentsService.allSegments$.pipe(
      map((segments: Segment[]) => {
        const dataSource = new MatTableDataSource<Segment>(segments);
        this.setFilterPredicateForSegments(dataSource);
        this.applyFilter(dataSource);
        return dataSource;
      })
    );
  }

  setFilterPredicateForSegments(dataSource: MatTableDataSource<Segment>) {
    dataSource.filterPredicate = (data: Segment, filter: string) => {
      const searchKey = this.segmentsService.selectSearchKey$;
      let searchKeyValue: SEGMENT_SEARCH_KEY;

      // Get the current search key value
      searchKey
        .subscribe((value) => {
          searchKeyValue = value;
        })
        .unsubscribe();

      filter = filter.toLowerCase();

      switch (searchKeyValue) {
        case SEGMENT_SEARCH_KEY.ALL:
          return (
            data.name.toLowerCase().includes(filter) ||
            data.status.toLowerCase().includes(filter) ||
            data.context.toLowerCase().includes(filter)
          );
        case SEGMENT_SEARCH_KEY.NAME:
          return data.name.toLowerCase().includes(filter);
        case SEGMENT_SEARCH_KEY.CONTEXT:
          return data.context.toLowerCase().includes(filter);
        default:
          return data.name.toLowerCase().includes(filter);
      }
    };
  }

  applyFilter(dataSource: MatTableDataSource<Segment>) {
    let searchString: string;

    // Get the current search string value
    this.searchString$
      .subscribe((value) => {
        searchString = value;
      })
      .unsubscribe();

    if (searchString) {
      dataSource.filter = searchString.trim().toLowerCase();
    }
  }

  onSearch(params: CommonSearchWidgetSearchParams<SEGMENT_SEARCH_KEY>) {
    this.segmentsService.setSearchString(params.searchString);
    this.segmentsService.setSearchKey(params.searchKey as SEGMENT_SEARCH_KEY);
  }

  onAddSegmentButtonClick() {
    // this.dialogService.openNewSegmentModal();
  }

  onMenuButtonItemClick(menuButtonItemName: string) {
    if (menuButtonItemName === 'Import Segment') {
      // this.dialogService.openImportSegmentsModal();
    } else if (menuButtonItemName === 'Export All Segments') {
      // this.dialogService.openExportAllSegmentModal();
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
