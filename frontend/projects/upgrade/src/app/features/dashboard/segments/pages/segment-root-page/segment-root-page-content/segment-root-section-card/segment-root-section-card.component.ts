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
import { TranslateModule } from '@ngx-translate/core';
import { SEGMENT_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';
import { RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Observable, map } from 'rxjs';
import { Segment, SEGMENTS_BUTTON_ACTION } from '../../../../../../../core/segments/store/segments.model';
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
  searchString$ = this.segmentsService.selectSearchString$;
  searchKey$ = this.segmentsService.selectSearchKey$;
  selectRootTableState$ = this.segmentsService.selectRootTableState$;
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
      label: 'segments.import-segment.text',
      action: SEGMENTS_BUTTON_ACTION.IMPORT,
      disabled: false,
    },
    {
      label: 'segments.export-all-segments.text',
      action: SEGMENTS_BUTTON_ACTION.EXPORT_ALL,
      disabled: true,
    },
  ];

  constructor(
    private segmentsService: SegmentsService,
    private dialogService: DialogService,
    private tableHelpersService: CommonTableHelpersService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.segmentsService.fetchSegmentsPaginated(true);
  }

  ngAfterViewInit() {
    this.dataSource$ = this.selectRootTableState$.pipe(
      map((tableState: TableState<Segment>) => {
        return this.tableHelpersService.mapTableStateToDataSource<Segment>(tableState);
      })
    );
  }

  onSearch(params: CommonSearchWidgetSearchParams<SEGMENT_SEARCH_KEY>) {
    this.segmentsService.setSearchString(params.searchString);
    this.segmentsService.setSearchKey(params.searchKey as SEGMENT_SEARCH_KEY);
  }

  onAddSegmentButtonClick() {
    this.dialogService.openAddSegmentModal();
  }

  onMenuButtonItemClick(action: string) {
    if (action === SEGMENTS_BUTTON_ACTION.IMPORT) {
      this.dialogService.openImportSegmentModal();
    } else if (action === SEGMENTS_BUTTON_ACTION.EXPORT_ALL) {
      // this.dialogService.openExportAllSegmentModal();
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
