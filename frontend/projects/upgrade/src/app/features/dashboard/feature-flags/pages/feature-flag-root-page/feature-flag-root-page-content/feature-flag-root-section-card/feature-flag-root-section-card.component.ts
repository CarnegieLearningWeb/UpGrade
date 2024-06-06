import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeatureFlagRootSectionCardTableComponent } from './feature-flag-root-section-card-table/feature-flag-root-section-card-table.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FLAG_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';
import { RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Observable, map } from 'rxjs';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { CommonSearchWidgetSearchParams } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-search-header/common-section-card-search-header.component';
import { CommonTableHelpersService } from '../../../../../../../shared/services/common-table-helpers.service';

@Component({
  selector: 'app-feature-flag-root-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    FeatureFlagRootSectionCardTableComponent,
    AsyncPipe,
    JsonPipe,
    NgIf,
    MatProgressSpinnerModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './feature-flag-root-section-card.component.html',
  styleUrl: './feature-flag-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootSectionCardComponent {
  dataSource$: Observable<MatTableDataSource<FeatureFlag>>;
  isLoadingFeatureFlags$ = this.featureFlagService.isLoadingFeatureFlags$;
  isInitialLoading$ = this.featureFlagService.isInitialFeatureFlagsLoading$;
  isAllFlagsFetched$ = this.featureFlagService.isAllFlagsFetched$;
  searchString$ = this.featureFlagService.searchString$;
  searchKey$ = this.featureFlagService.searchKey$;
  searchParams$ = this.featureFlagService.searchParams$;
  selectRootTableState$ = this.featureFlagService.selectRootTableState$;

  featureFlagFilterOption = [
    FLAG_SEARCH_KEY.ALL,
    FLAG_SEARCH_KEY.NAME,
    FLAG_SEARCH_KEY.STATUS,
    FLAG_SEARCH_KEY.CONTEXT,
  ];
  isSectionCardExpanded = true;

  menuButtonItems: IMenuButtonItem[] = [
    {
      name: this.translateService.instant('feature-flags.import-feature-flag.text'),
      disabled: false,
    },
    {
      name: this.translateService.instant('feature-flags.export-all-feature-flags.text'),
      disabled: true,
    },
  ];

  constructor(
    private featureFlagService: FeatureFlagsService,
    private translateService: TranslateService,
    private dialogService: DialogService,
    private tableHelpersService: CommonTableHelpersService
  ) {}

  ngOnInit() {
    this.featureFlagService.fetchFeatureFlags();
  }

  ngAfterViewInit() {
    this.dataSource$ = this.featureFlagService.selectRootTableState$.pipe(
      map(this.tableHelpersService.mapTableStateToDataSource<FeatureFlag>)
    );
  }

  onSearch(params: CommonSearchWidgetSearchParams<FLAG_SEARCH_KEY>) {
    this.featureFlagService.setSearchString(params.searchString);
    this.featureFlagService.setSearchKey(params.searchKey as FLAG_SEARCH_KEY);
  }

  onAddFeatureFlagButtonClick() {
    this.dialogService.openAddFeatureFlagModal();
  }

  onMenuButtonItemClick(menuButtonItemName: string) {
    console.log('onMenuButtonItemClick:', menuButtonItemName);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
