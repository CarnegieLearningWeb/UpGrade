import { Observable } from 'rxjs';

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import {
  EXPERIMENT_ROOT_COLUMN_NAMES,
  EXPERIMENT_ROOT_DISPLAYED_COLUMNS,
  EXPERIMENT_TRANSLATION_KEYS,
  Experiment,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import {
  CommonStatusIndicatorChipComponent,
  CommonTagListComponent,
} from '../../../../../../../../shared-standalone-component-lib/components';
import { ExperimentService } from '../../../../../../../../core/experiments/experiments.service';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { EXPERIMENT_STATE, FILTER_MODE, EXPERIMENT_SEARCH_KEY } from 'upgrade_types';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-experiment-root-section-card-table',
  imports: [
    MatTableModule,
    AsyncPipe,
    NgIf,
    SharedModule,
    RouterModule,
    CommonStatusIndicatorChipComponent,
    CommonTagListComponent,
    NgxSkeletonLoaderModule,
  ],
  templateUrl: './experiment-root-section-card-table.component.html',
  styleUrl: './experiment-root-section-card-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRootSectionCardTableComponent implements OnInit {
  @Input() dataSource$: MatTableDataSource<Experiment>;
  @Input() isLoading$: Observable<boolean>;
  @Input() isSearchActive$: Observable<boolean>;
  @Input() expandedTagsMap: Map<string, boolean>;
  @Output() tagsExpanded = new EventEmitter<{ experimentId: string; expanded: boolean }>();
  experimentSortKey$ = this.experimentService.selectExperimentSortKey$;
  experimentSortAs$ = this.experimentService.selectExperimentSortAs$;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('tableContainer') tableContainer: ElementRef;
  @ViewChild('bottomTrigger') bottomTrigger: ElementRef;

  private observer: IntersectionObserver;

  constructor(private readonly experimentService: ExperimentService) {}

  ngOnInit() {
    this.sortTable();
  }

  fetchExperimentOnScroll() {
    this.experimentService.loadExperiments();
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
        this.fetchExperimentOnScroll();
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

  filterExperimentByChips(tagValue: string, type: EXPERIMENT_SEARCH_KEY) {
    this.setSearchKey(type);
    this.setSearchString(tagValue);
  }

  setSearchKey(searchKey: EXPERIMENT_SEARCH_KEY) {
    this.experimentService.setSearchKey(searchKey);
  }

  setSearchString(searchString: string) {
    this.experimentService.setSearchString(searchString);
  }

  get EXPERIMENT_STATE() {
    return EXPERIMENT_STATE;
  }

  get FILTER_MODE() {
    return FILTER_MODE;
  }

  get displayedColumns(): string[] {
    return EXPERIMENT_ROOT_DISPLAYED_COLUMNS;
  }

  get EXPERIMENT_TRANSLATION_KEYS() {
    return EXPERIMENT_TRANSLATION_KEYS;
  }

  get EXPERIMENT_ROOT_COLUMN_NAMES() {
    return EXPERIMENT_ROOT_COLUMN_NAMES;
  }

  get ExperimentSearchKey() {
    return EXPERIMENT_SEARCH_KEY;
  }

  changeSorting(event) {
    if (event.direction) {
      this.experimentService.setSortingType(event.direction.toUpperCase());
      this.experimentService.setSortKey(event.active);
    } else {
      // When sorting is cleared, revert to default sorting
      this.experimentService.setSortingType(null);
      this.experimentService.setSortKey(null);
      this.tableContainer.nativeElement.scroll({
        top: 0,
        behavior: 'smooth',
      });
      const sortedData = [...this.dataSource$.data];
      sortedData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      this.dataSource$.data = sortedData;
    }
  }

  isTagsExpanded(experimentId: string): boolean {
    return this.expandedTagsMap?.get(experimentId) || false;
  }

  onTagExpandedChange(experimentId: string, expanded: boolean): void {
    this.tagsExpanded.emit({ experimentId, expanded });
  }
}
