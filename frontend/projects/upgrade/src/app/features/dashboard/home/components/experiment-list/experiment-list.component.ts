import { Component, OnInit, ViewChild, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import {
  Experiment,
  EXPERIMENT_STATE,
  EXPERIMENT_SEARCH_KEY,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Subscription, Observable, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NewExperimentComponent } from '../modal/new-experiment/new-experiment.component';
import { ExperimentStatePipeType } from '../../../../../shared/pipes/experiment-state.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ImportExperimentComponent } from '../modal/import-experiment/import-experiment.component';
import { ExportModalComponent } from '../modal/export-experiment/export-experiment.component';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss'],
  standalone: false,
})
export class ExperimentListComponent implements OnInit, OnDestroy, AfterViewInit {
  permissions$: Observable<UserPermission>;
  displayedColumns: string[] = ['name', 'state', 'postExperimentRule', 'updatedAt', 'context', 'tags', 'enrollment'];
  allExperiments: MatTableDataSource<Experiment>;
  allExperimentsExcludingArchived: MatTableDataSource<Experiment>;
  allExperimentsSub: Subscription;
  experimentFilterOptions = [
    EXPERIMENT_SEARCH_KEY.ALL,
    EXPERIMENT_SEARCH_KEY.NAME,
    EXPERIMENT_SEARCH_KEY.STATUS,
    EXPERIMENT_SEARCH_KEY.TAG,
    EXPERIMENT_SEARCH_KEY.CONTEXT,
  ];
  statusFilterOptions = Object.values(EXPERIMENT_STATE);
  selectedExperimentFilterOption = EXPERIMENT_SEARCH_KEY.ALL;
  searchValue: string;
  contextVisibility = [];
  tagsVisibility = [];
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;
  isAllExperimentsFetched = false;
  isAllExperimentsFetchedSub: Subscription;
  experimentSortKey$: Observable<string>;
  experimentSortAs$: Observable<string>;
  @ViewChild('tableContainer') experimentTableContainer: ElementRef;
  @ViewChild('bottomTrigger') bottomTrigger: ElementRef;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  get filteredStatusOptions(): string[] {
    if (typeof this.searchValue === 'string') {
      const filterValue = this.searchValue.toLowerCase();
      return this.statusFilterOptions.filter((option) => option.toLowerCase().includes(filterValue));
    } else {
      return this.statusFilterOptions;
    }
  }

  private observer: IntersectionObserver;
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;

  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allExperimentsSub = this.experimentService.experiments$.subscribe((allExperiments) => {
      const allExperimentsExcludingArchived = allExperiments.filter((experiment) => experiment.state !== 'archived');
      this.allExperimentsExcludingArchived = new MatTableDataSource();
      this.allExperimentsExcludingArchived.data = [...allExperimentsExcludingArchived];
      this.allExperimentsExcludingArchived.sortingDataAccessor = (item, property) =>
        property === 'name' ? item.name.toLowerCase() : item[property];
      this.allExperimentsExcludingArchived.sort = this.sort;
      this.allExperiments = new MatTableDataSource();
      this.allExperiments.data = [...allExperiments];
      this.allExperiments.sortingDataAccessor = (item, property) =>
        property === 'name' ? item.name.toLowerCase() : item[property];
      this.allExperiments.sort = this.sort;
      this.applyFilter(this.searchValue);
    });
    this.experimentSortKey$ = this.experimentService.selectExperimentSortKey$;
    this.experimentSortAs$ = this.experimentService.selectExperimentSortAs$;

    this.experimentService.selectSearchExperimentParams().subscribe((searchParams: any) => {
      // Used when user clicks on context or tags from view experiment page
      this.searchValue = searchParams.searchString;
      this.selectedExperimentFilterOption = searchParams.searchKey;
      this.applyFilter(searchParams.searchString);
    });

    this.isAllExperimentsFetchedSub = this.experimentService
      .isAllExperimentsFetched()
      .subscribe((value) => (this.isAllExperimentsFetched = value));

    // Set up search debouncing
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchValue: string) => {
        this.setSearchString(searchValue);
      });
  }

  // Modify angular material's table's default search behavior
  filterExperimentPredicate(type: EXPERIMENT_SEARCH_KEY) {
    if (type === EXPERIMENT_SEARCH_KEY.STATUS) {
      this.allExperiments.filterPredicate = (data, filter: string): boolean => {
        switch (type) {
          case EXPERIMENT_SEARCH_KEY.STATUS:
            return data.state.toLowerCase().includes(filter);
        }
      };
    } else {
      this.allExperimentsExcludingArchived.filterPredicate = (data, filter: string): boolean => {
        switch (type) {
          case EXPERIMENT_SEARCH_KEY.ALL:
            return (
              data.name.toLocaleLowerCase().includes(filter) ||
              data.state.toLocaleLowerCase().includes(filter) ||
              !!data.tags.filter((tags) => tags.toLocaleLowerCase().includes(filter)).length ||
              this.isPartitionFound(data, filter) ||
              !!data.context.filter((context) => context.toLocaleLowerCase().includes(filter)).length
            );
          case EXPERIMENT_SEARCH_KEY.NAME:
            return data.name.toLocaleLowerCase().includes(filter) || this.isPartitionFound(data, filter);
          case EXPERIMENT_SEARCH_KEY.TAG:
            return !!data.tags.filter((tags) => tags.toLocaleLowerCase().includes(filter)).length;
          case EXPERIMENT_SEARCH_KEY.CONTEXT:
            return !!data.context.filter((context) => context.toLocaleLowerCase().includes(filter)).length;
        }
      };
    }
  }

  // Used to search based on partition point and name
  isPartitionFound(data: Experiment, filterValue: string): boolean {
    const isPartitionFound = data.partitions.filter(
      (partition) =>
        (partition.target ? partition.target.toLocaleLowerCase().includes(filterValue) : false) ||
        partition.site.toLocaleLowerCase().includes(filterValue)
    );
    return !!isPartitionFound.length;
  }

  applyFilter(filterValue: string) {
    this.filterExperimentPredicate(this.selectedExperimentFilterOption);
    if (typeof filterValue === 'string') {
      if (this.selectedExperimentFilterOption === EXPERIMENT_SEARCH_KEY.STATUS) {
        this.allExperiments.filter = filterValue.trim().toLowerCase();
      } else {
        this.allExperimentsExcludingArchived.filter = filterValue.trim().toLowerCase();
      }
    }
  }

  setSearchKey(searchKey: EXPERIMENT_SEARCH_KEY) {
    this.experimentService.setSearchKey(searchKey);
  }

  setSearchString(searchString: string) {
    this.experimentService.setSearchString(searchString);
  }

  changeSorting(event) {
    this.experimentService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.experimentService.setSortKey(event.direction ? event.active : null);
    this.experimentTableContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth',
    });
    this.experimentService.loadExperiments(true);
  }

  filterExperimentByChips(tagValue: string, type: EXPERIMENT_SEARCH_KEY) {
    this.setSearchKey(type);
    this.setSearchString(tagValue);
  }

  openNewExperimentDialog() {
    this.dialog.open(NewExperimentComponent, {
      panelClass: 'new-experiment-modal',
      disableClose: true,
    });
  }

  openImportExperimentDialog() {
    this.dialog.open(ImportExperimentComponent, {
      panelClass: 'import-experiment-modal',
    });
  }

  openExportAllExperimentsDialog() {
    this.dialog.open(ExportModalComponent, {
      panelClass: 'export-modal',
      data: { experiment: this.allExperiments.data, exportAll: true },
    });
  }

  setChipsVisible(experimentId: string, type: string) {
    const index = this[type].findIndex((data) => {
      return data.experimentId === experimentId;
    });
    if (index !== -1) {
      this[type][index] = { experimentId, visibility: true };
    } else {
      this[type].push({ experimentId, visibility: true });
    }
    this[type].forEach((data, tagIndex) => {
      if (data.experimentId !== experimentId) {
        this[type][tagIndex] = { ...data, visibility: false };
      }
    });
  }

  // Used to check whether context or tags are visible for particular experiment or not
  isAllChipsVisible(experimentId: string, type: string): boolean {
    const index = this[type].findIndex((data) => data.experimentId === experimentId);
    return index !== -1 ? this[type][index].visibility : false;
  }

  getConditionCode(conditionId: string, experimentId: string) {
    const experimentFound = this.allExperiments.data.find((experiment) => experiment.id === experimentId);
    return experimentFound
      ? '(' + experimentFound.conditions.find((condition) => condition.id === conditionId).conditionCode + ')'
      : '';
  }

  fetchExperimentOnScroll() {
    if (!this.isAllExperimentsFetched) {
      this.experimentService.loadExperiments();
    }
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.experimentTableContainer.nativeElement.style.maxHeight = windowHeight - 325 + 'px';

    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    this.allExperimentsSub.unsubscribe();
    this.isAllExperimentsFetchedSub.unsubscribe();

    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchInputKeyup(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    this.applyFilter(target.value);
  }

  onSearchInputChange(value: string): void {
    this.searchSubject.next(value);
  }

  onAutocompleteSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedValue = event.option.value;
    this.applyFilter(selectedValue);
    this.setSearchString(selectedValue);
  }

  private setupIntersectionObserver() {
    const options = {
      root: this.experimentTableContainer.nativeElement,
      rootMargin: '100px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.fetchExperimentOnScroll();
      }
    }, options);

    if (this.bottomTrigger) {
      this.observer.observe(this.bottomTrigger.nativeElement);
    }
  }

  get ExperimentStatePipeTypes() {
    return ExperimentStatePipeType;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  get ExperimentSearchKey() {
    return EXPERIMENT_SEARCH_KEY;
  }
}
