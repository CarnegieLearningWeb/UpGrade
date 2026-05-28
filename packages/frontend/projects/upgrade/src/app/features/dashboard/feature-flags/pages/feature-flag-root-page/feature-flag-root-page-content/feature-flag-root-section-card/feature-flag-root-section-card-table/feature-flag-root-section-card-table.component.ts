import { Observable } from 'rxjs';

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  AfterViewInit,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import {
  FLAG_ROOT_COLUMN_NAMES,
  FLAG_ROOT_DISPLAYED_COLUMNS,
  FLAG_TRANSLATION_KEYS,
  FeatureFlag,
} from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { MatTableModule } from '@angular/material/table';
import { AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { CommonStatusIndicatorChipComponent, CommonTagListComponent } from '@shared-component-lib';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { FEATURE_FLAG_STATUS, FILTER_MODE, FLAG_SEARCH_KEY } from 'upgrade_types';

@Component({
  selector: 'app-feature-flag-root-section-card-table',
  imports: [
    MatTableModule,
    AsyncPipe,
    SharedModule,
    RouterModule,
    CommonStatusIndicatorChipComponent,
    CommonTagListComponent,
  ],
  templateUrl: './feature-flag-root-section-card-table.component.html',
  styleUrl: './feature-flag-root-section-card-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootSectionCardTableComponent implements AfterViewInit, OnDestroy {
  @Input() featureFlags$: Observable<FeatureFlag[]>;
  @Input() isLoading$: Observable<boolean>;
  @Input() isSearchActive$: Observable<boolean>;
  @Input() expandedTagsMap: Map<string, boolean>;
  @Output() tagsExpanded = new EventEmitter<{ flagId: string; expanded: boolean }>();
  flagSortKey$ = this.featureFlagsService.sortKey$;
  flagSortAs$ = this.featureFlagsService.sortAs$;
  warningKeysForAllFlags$ = this.featureFlagsService.warningKeysForAllFlags$;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('tableContainer') tableContainer: ElementRef;
  @ViewChild('bottomTrigger') bottomTrigger: ElementRef;

  private observer: IntersectionObserver;

  constructor(private featureFlagsService: FeatureFlagsService) {}

  ngAfterViewInit() {
    this.setupIntersectionObserver();
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
      // Make backend call with new sort parameters
      this.featureFlagsService.setSortingType(event.direction.toUpperCase());
      this.featureFlagsService.setSortKey(event.active);
      this.featureFlagsService.fetchFeatureFlags(true); // true = reset pagination
    } else {
      // When sorting is cleared, revert to default sorting
      this.featureFlagsService.setSortingType(null);
      this.featureFlagsService.setSortKey(null);
      this.featureFlagsService.fetchFeatureFlags(true); // true = reset pagination

      // Scroll to top when sorting is cleared
      this.tableContainer.nativeElement.scroll({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  isTagsExpanded(flagId: string): boolean {
    return this.expandedTagsMap?.get(flagId) || false;
  }

  onTagExpandedChange(flagId: string, expanded: boolean): void {
    this.tagsExpanded.emit({ flagId, expanded });
  }
}
