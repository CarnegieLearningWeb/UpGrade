import { Observable } from 'rxjs';

import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import {
  FLAG_ROOT_COLUMN_NAMES,
  FLAG_ROOT_DISPLAYED_COLUMNS,
  FLAG_TRANSLATION_KEYS,
  FeatureFlag,
} from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf, NgFor, UpperCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { CommonStatusIndicatorChipComponent } from '../../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { FEATURE_FLAG_STATUS, FILTER_MODE, FLAG_SEARCH_KEY } from 'upgrade_types';

@Component({
    selector: 'app-feature-flag-root-section-card-table',
    imports: [
        MatTableModule,
        AsyncPipe,
        NgIf,
        NgFor,
        SharedModule,
        UpperCasePipe,
        RouterModule,
        CommonStatusIndicatorChipComponent,
    ],
    templateUrl: './feature-flag-root-section-card-table.component.html',
    styleUrl: './feature-flag-root-section-card-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureFlagRootSectionCardTableComponent implements OnInit {
  @Input() dataSource$: MatTableDataSource<FeatureFlag>;
  @Input() isLoading$: Observable<boolean>;
  @Input() isSearchActive$: Observable<boolean>;
  flagSortKey$ = this.featureFlagsService.sortKey$;
  flagSortAs$ = this.featureFlagsService.sortAs$;
  warningStatusForAllFlags$ = this.featureFlagsService.warningStatusForAllFlags$;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('tableContainer') tableContainer: ElementRef;
  @ViewChild('bottomTrigger') bottomTrigger: ElementRef;

  private observer: IntersectionObserver;

  constructor(private featureFlagsService: FeatureFlagsService) {}

  ngOnInit() {
    this.sortTable();
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnChanges() {
    this.sortTable();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver() {
    const options = {
      root: this.tableContainer.nativeElement,
      rootMargin: '100px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.fetchFlagsOnScroll();
      }
    }, options);

    if (this.bottomTrigger) {
      this.observer.observe(this.bottomTrigger.nativeElement);
    }
  }

  private sortTable() {
    if (this.dataSource$?.data) {
      this.dataSource$.sortingDataAccessor = (item, property) =>
        property === 'name' ? item.name.toLowerCase() : item[property];
      this.dataSource$.sort = this.sort;
    }
  }

  filterFeatureFlagByChips(tagValue: string, type: FLAG_SEARCH_KEY) {
    this.setSearchKey(type);
    this.setSearchString(tagValue);
  }

  setSearchKey(searchKey: FLAG_SEARCH_KEY) {
    this.featureFlagsService.setSearchKey(searchKey);
  }

  setSearchString(searchString: string) {
    this.featureFlagsService.setSearchString(searchString);
  }

  get FEATURE_FLAG_STATUS() {
    return FEATURE_FLAG_STATUS;
  }

  get FILTER_MODE() {
    return FILTER_MODE;
  }

  get displayedColumns(): string[] {
    return FLAG_ROOT_DISPLAYED_COLUMNS;
  }

  get FLAG_TRANSLATION_KEYS() {
    return FLAG_TRANSLATION_KEYS;
  }

  get FLAG_ROOT_COLUMN_NAMES() {
    return FLAG_ROOT_COLUMN_NAMES;
  }

  get FeatureFlagSearchKey() {
    return FLAG_SEARCH_KEY;
  }

  fetchFlagsOnScroll() {
    this.featureFlagsService.fetchFeatureFlags();
  }

  changeSorting(event) {
    if (event.direction) {
      this.featureFlagsService.setSortingType(event.direction.toUpperCase());
      this.featureFlagsService.setSortKey(event.active);
    } else {
      // When sorting is cleared, revert to default sorting
      this.featureFlagsService.setSortingType(null);
      this.featureFlagsService.setSortKey(null);
      this.tableContainer.nativeElement.scroll({
        top: 0,
        behavior: 'smooth',
      });
      this.dataSource$.data = this.dataSource$.data.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  }
}
