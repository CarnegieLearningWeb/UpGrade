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
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

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
  isLoadingSegments$ = this.segmentService.isLoadingSegments$;
  isInitialLoading$ = this.segmentService.isInitialSegmentsLoading();
  searchString$ = this.segmentService.selectSearchString$;
  searchKey$ = this.segmentService.selectSearchKey$;
  selectRootTableState$ = this.segmentService.selectRootTableState$;
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
    private segmentService: SegmentsService,
    private translateService: TranslateService,
    private dialogService: DialogService,
    private tableHelpersService: CommonTableHelpersService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.segmentService.fetchSegments(true);
  }

  ngAfterViewInit() {
    this.dataSource$ = this.selectRootTableState$.pipe(
      map((tableState: TableState<Segment>) => {
        return this.tableHelpersService.mapTableStateToDataSource<Segment>(tableState);
      })
    );
  }

  onSearch(params: CommonSearchWidgetSearchParams<SEGMENT_SEARCH_KEY>) {
    this.segmentService.setSearchString(params.searchString);
    this.segmentService.setSearchKey(params.searchKey as SEGMENT_SEARCH_KEY);
  }

  onSlideToggleChange(event: MatSlideToggleChange): void {
    const slideToggleEvent = event.source;
    console.log(`Show Global Excludes: ${slideToggleEvent.checked}`);
  }

  onAddSegmentButtonClick() {
    // this.dialogService.openNewSegmentModal();
  }

  onMenuButtonItemClick(menuButtonItemName: string) {
    if (menuButtonItemName === 'Import Segment') {
      // this.dialogService.openImportSegmentsModal();
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
