import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Observable, Subscription, fromEvent } from 'rxjs';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { FeatureFlag, FLAG_SEARCH_SORT_KEY } from '../../../../../core/feature-flags/store/feature-flags.model';
import { NewFlagComponent } from '../modal/new-flag/new-flag.component';
import { debounceTime } from 'rxjs/operators';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'feature-flags-list',
  templateUrl: './feature-flags-list.component.html',
  styleUrls: ['./feature-flags-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagsListComponent implements OnInit, OnDestroy, AfterViewInit {
  permissions$: Observable<UserPermission>;
  displayedColumns: string[] = ['name', 'key', 'variationType', 'activeVariant', 'status'];
  allFeatureFlags: MatTableDataSource<FeatureFlag>;
  allFeatureFlagsSub: Subscription;
  isLoadingFeatureFlags$ = this.featureFlagsService.isLoadingFeatureFlags$;

  flagsFilterOptions = [
    { value: FLAG_SEARCH_SORT_KEY.ALL, viewValue: FLAG_SEARCH_SORT_KEY.ALL },
    { value: FLAG_SEARCH_SORT_KEY.NAME, viewValue: FLAG_SEARCH_SORT_KEY.NAME },
    { value: FLAG_SEARCH_SORT_KEY.KEY, viewValue: FLAG_SEARCH_SORT_KEY.KEY },
    { value: FLAG_SEARCH_SORT_KEY.STATUS, viewValue: FLAG_SEARCH_SORT_KEY.STATUS },
    { value: FLAG_SEARCH_SORT_KEY.VARIATION_TYPE, viewValue: 'Type' },
  ];
  selectedFlagFilterOption = FLAG_SEARCH_SORT_KEY.ALL;
  searchValue: string;
  isAllFlagsFetched = false;
  isAllFlagsFetchedSub: Subscription;

  @ViewChild('tableContainer') featureFlagsTableContainer: ElementRef;
  @ViewChild('searchInput') searchInput: ElementRef;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private authService: AuthService,
    private featureFlagsService: FeatureFlagsService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allFeatureFlagsSub = this.featureFlagsService.allFeatureFlags$.subscribe((allFeatureFlags) => {
      this.allFeatureFlags = new MatTableDataSource();
      this.allFeatureFlags.data = [...allFeatureFlags];
      this.allFeatureFlags.sort = this.sort;
      this.applyFilter(this.searchValue);
    });

    this.isAllFlagsFetchedSub = this.featureFlagsService
      .isAllFlagsFetched()
      .subscribe((value) => (this.isAllFlagsFetched = value));
  }

  openNewFlagDialog() {
    const dialogRef = this.dialog.open(NewFlagComponent, {
      panelClass: 'new-flag-modal',
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Code will be executed after closing dialog
    });
  }

  applyFilter(filterValue: string) {
    this.filterFlagsPredicate(this.selectedFlagFilterOption);
    if (filterValue !== undefined) {
      this.allFeatureFlags.filter = filterValue.trim().toLowerCase();
    }
  }

  changeFlagStatus(flagId: string, event: any) {
    this.featureFlagsService.updateFeatureFlagStatus(flagId, event.checked);
  }

  getActiveVariation(flag: FeatureFlag) {
    return this.featureFlagsService.getActiveVariation(flag);
  }

  setSearchKey() {
    this.featureFlagsService.setSearchKey(this.selectedFlagFilterOption);
  }

  setSearchString(searchString: FLAG_SEARCH_SORT_KEY) {
    this.featureFlagsService.setSearchString(searchString);
  }

  // Modify angular material's table's default search behavior
  filterFlagsPredicate(type: FLAG_SEARCH_SORT_KEY) {
    this.allFeatureFlags.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case FLAG_SEARCH_SORT_KEY.ALL:
          return (
            data.name.toLocaleLowerCase().includes(filter) ||
            (data.status + '').toLocaleLowerCase().includes(filter) ||
            data.key.toLocaleLowerCase().includes(filter) ||
            data.variationType.toLocaleLowerCase().includes(filter) ||
            this.isVariationFound(data, filter)
          );
        case FLAG_SEARCH_SORT_KEY.NAME:
          return data.name.toLowerCase().includes(filter) || this.isVariationFound(data, filter);
        case FLAG_SEARCH_SORT_KEY.STATUS:
          return (data.status + '').toLowerCase().includes(filter);
        case FLAG_SEARCH_SORT_KEY.KEY:
          return data.key.toLowerCase().includes(filter);
        case FLAG_SEARCH_SORT_KEY.VARIATION_TYPE:
          return data.variationType.toLowerCase().includes(filter);
      }
    };
  }

  // Used to search based on variation value
  isVariationFound(data: FeatureFlag, filterValue: string): boolean {
    const isVariationFound = data.variations.filter((variation) => variation.value.includes(filterValue));
    return !!isVariationFound.length;
  }

  changeSorting(event) {
    this.featureFlagsService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.featureFlagsService.setSortKey(event.direction ? event.active : null);
    this.featureFlagsTableContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth',
    });
    this.featureFlagsService.fetchFeatureFlags(true);
  }

  fetchFlagsOnScroll() {
    if (!this.isAllFlagsFetched) {
      this.featureFlagsService.fetchFeatureFlags();
    }
  }

  ngOnDestroy() {
    this.allFeatureFlagsSub.unsubscribe();
    this.isAllFlagsFetchedSub.unsubscribe();

    this.featureFlagsService.setSearchString(null);
    this.featureFlagsService.setSearchKey(FLAG_SEARCH_SORT_KEY.ALL);
    this.featureFlagsService.setSortKey(null);
    this.featureFlagsService.setSortingType(null);
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.featureFlagsTableContainer.nativeElement.style.maxHeight = windowHeight - 325 + 'px';

    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(debounceTime(500))
      .subscribe((searchInput) => {
        this.setSearchString((searchInput as any).target.value);
      });
  }
}
