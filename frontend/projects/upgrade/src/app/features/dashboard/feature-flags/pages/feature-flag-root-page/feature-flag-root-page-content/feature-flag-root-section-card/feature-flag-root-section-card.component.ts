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
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { FeatureFlag, SearchParam } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { selectSearchFeatureFlagParams } from '../../../../../../../core/feature-flags/store/feature-flags.selectors';
import { AppState } from '../../../../../../../core/core.state';

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
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  allFeatureFlagsSub: Subscription;
  allFeatureFlags: MatTableDataSource<FeatureFlag>;
  isLoadingFeatureFlags$ = this.featureFlagService.isLoadingFeatureFlags$;
  isInitialLoading$ = this.featureFlagService.isInitialFeatureFlagsLoading$;
  isAllFlagsFetched$ = this.featureFlagService.isAllFlagsFetched$;
  searchValue = '';
  selectedFeatureFlagFilterOption = FLAG_SEARCH_KEY.ALL;
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
    private store$: Store<AppState>
  ) {}

  ngOnInit() {
    this.featureFlagService.fetchFeatureFlags();
    this.allFeatureFlagsSub = this.featureFlagService.allFeatureFlags$.subscribe((featureFlags) => {
      this.allFeatureFlags = new MatTableDataSource();
      this.allFeatureFlags.data = [...featureFlags];
      this.allFeatureFlags.sort = this.sort;
      this.applyFilter(this.searchValue);
    });

    this.store$.select(selectSearchFeatureFlagParams).subscribe((searchParams: any) => {
      // Used when user clicks on context from view segment page
      if (searchParams) {
        this.searchValue = searchParams.searchString;
        this.selectedFeatureFlagFilterOption = searchParams.searchKey;
        this.applyFilter(searchParams.searchString);
      }
    });
  }

  applyFilter(filterValue: string) {
    this.filterSegmentPredicate(this.selectedFeatureFlagFilterOption);
    if (typeof filterValue === 'string') {
      this.allFeatureFlags.filter = filterValue.trim().toLowerCase();
    }
  }

  filterSegmentPredicate(type: FLAG_SEARCH_KEY) {
    this.allFeatureFlags.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case FLAG_SEARCH_KEY.ALL:
          return (
            data.name.toLocaleLowerCase().includes(filter) ||
            data.status.toLocaleLowerCase().includes(filter) ||
            (Array.isArray(data.context) &&
              data.context.some((context) => context.toLocaleLowerCase().includes(filter)))
          );
        case FLAG_SEARCH_KEY.NAME:
          return data.name.toLocaleLowerCase().includes(filter);
        case FLAG_SEARCH_KEY.STATUS:
          return data.status.toLocaleLowerCase().includes(filter);
        case FLAG_SEARCH_KEY.CONTEXT:
          return (
            Array.isArray(data.context) && data.context.some((context) => context.toLocaleLowerCase().includes(filter))
          );
      }
    };
  }

  onSearch(value: SearchParam) {
    this.featureFlagService.setSearchString(value.searchValue);
    this.featureFlagService.setSearchKey(value.filterType);
  }

  onAddFeatureFlagButtonClick() {
    console.log('onAddFeatureFlagButtonClick');
  }

  onMenuButtonItemClick(menuButtonItemName: string) {
    console.log('onMenuButtonItemClick:', menuButtonItemName);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    console.log('onSectionCardExpandChange:', isSectionCardExpanded);
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
