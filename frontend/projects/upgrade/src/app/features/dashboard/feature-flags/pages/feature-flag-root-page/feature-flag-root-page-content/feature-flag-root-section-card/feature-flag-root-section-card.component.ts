import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeatureFlagRootSectionCardTableComponent } from './feature-flag-root-section-card-table/feature-flag-root-section-card-table.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FLAG_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';
import { RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Observable, map } from 'rxjs';
import {
  FEATURE_FLAG_BUTTON_ACTION,
  FeatureFlag,
} from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { CommonSearchWidgetSearchParams } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-search-header/common-section-card-search-header.component';
import {
  CommonTableHelpersService,
  TableState,
} from '../../../../../../../shared/services/common-table-helpers.service';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-feature-flag-root-section-card',
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    FeatureFlagRootSectionCardTableComponent,
    AsyncPipe,
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
  permissions$: Observable<UserPermission>;
  dataSource$: Observable<MatTableDataSource<FeatureFlag>>;
  isLoadingFeatureFlags$ = this.featureFlagService.isLoadingFeatureFlags$;
  isInitialLoading$ = this.featureFlagService.isInitialFeatureFlagsLoading$;
  isAllFlagsFetched$ = this.featureFlagService.isAllFlagsFetched$;
  searchString$ = this.featureFlagService.searchString$;
  searchKey$ = this.featureFlagService.searchKey$;
  searchParams$ = this.featureFlagService.searchParams$;
  selectRootTableState$ = this.featureFlagService.selectRootTableState$;
  isSearchActive$: Observable<boolean> = this.searchString$.pipe(map((searchString) => !!searchString));

  featureFlagFilterOption = [
    FLAG_SEARCH_KEY.ALL,
    FLAG_SEARCH_KEY.NAME,
    FLAG_SEARCH_KEY.STATUS,
    FLAG_SEARCH_KEY.CONTEXT,
    FLAG_SEARCH_KEY.TAG,
  ];
  isSectionCardExpanded = true;

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'feature-flags.import-feature-flag.text',
      action: FEATURE_FLAG_BUTTON_ACTION.IMPORT,
      disabled: false,
    },
    {
      label: 'feature-flags.export-all-feature-flags.text',
      action: FEATURE_FLAG_BUTTON_ACTION.EXPORT_ALL,
      disabled: true,
    },
  ];

  constructor(
    private featureFlagService: FeatureFlagsService,
    private translateService: TranslateService,
    private dialogService: DialogService,
    private tableHelpersService: CommonTableHelpersService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.featureFlagService.fetchFeatureFlags(true);
  }

  ngAfterViewInit() {
    this.dataSource$ = this.featureFlagService.selectRootTableState$.pipe(
      map((tableState: TableState<FeatureFlag>) => {
        return this.tableHelpersService.mapTableStateToDataSource<FeatureFlag>(tableState);
      })
    );
  }

  onSearch(params: CommonSearchWidgetSearchParams<FLAG_SEARCH_KEY>) {
    this.featureFlagService.setSearchString(params.searchString);
    this.featureFlagService.setSearchKey(params.searchKey as FLAG_SEARCH_KEY);
  }

  onAddFeatureFlagButtonClick() {
    this.dialogService.openAddFeatureFlagModal();
  }

  onMenuButtonItemClick(action: string) {
    if (action === FEATURE_FLAG_BUTTON_ACTION.IMPORT) {
      this.dialogService.openImportFeatureFlagModal();
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
