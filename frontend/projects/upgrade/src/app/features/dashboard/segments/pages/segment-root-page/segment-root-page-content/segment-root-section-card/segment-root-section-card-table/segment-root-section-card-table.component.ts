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

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import {
  CommonStatusIndicatorChipComponent,
  CommonTagListComponent,
} from '../../../../../../../../shared-standalone-component-lib/components';
import { SegmentsService } from '../../../../../../../../core/segments/segments.service';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { SEGMENT_SEARCH_KEY } from 'upgrade_types';
import {
  NUMBER_OF_SEGMENTS,
  Segment,
  SEGMENT_ROOT_COLUMN_NAMES,
  SEGMENT_ROOT_DISPLAYED_COLUMNS,
  SEGMENT_TRANSLATION_KEYS,
} from '../../../../../../../../core/segments/store/segments.model';

@Component({
  selector: 'app-segment-root-section-card-table',
  imports: [
    MatTableModule,
    AsyncPipe,
    NgIf,
    NgFor,
    SharedModule,
    RouterModule,
    CommonStatusIndicatorChipComponent,
    CommonTagListComponent,
  ],
  templateUrl: './segment-root-section-card-table.component.html',
  styleUrl: './segment-root-section-card-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentRootSectionCardTableComponent implements OnInit {
  @Input() dataSource$: MatTableDataSource<Segment>;
  @Input() isLoading$: Observable<boolean>;
  @Input() isSearchActive$: Observable<boolean>;
  @Input() expandedTagsMap: Map<string, boolean>;
  @Output() tagsExpanded = new EventEmitter<{ segmentId: string; expanded: boolean }>();
  segmentSortKey$ = this.segmentsService.selectSegmentSortKey$;
  segmentSortAs$ = this.segmentsService.selectSegmentSortAs$;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('tableContainer') tableContainer: ElementRef;
  @ViewChild('bottomTrigger') bottomTrigger: ElementRef;

  private observer: IntersectionObserver;

  constructor(private segmentsService: SegmentsService) {}

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
      // if the list is short, this will trigger again on page load because the bottom trigger is within range already
      // if the size of the filtered set is less than the number of segments to take though, fetching more will not be needed
      const isFilteredSetLessThanTake = this.dataSource$?.filteredData?.length < NUMBER_OF_SEGMENTS;

      if (entries[0].isIntersecting && !isFilteredSetLessThanTake) {
        this.fetchSegmentsOnScroll();
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

  filterSegmentByChips(tagValue: string, type: SEGMENT_SEARCH_KEY) {
    this.setSearchKey(type);
    this.setSearchString(tagValue);
  }

  setSearchKey(searchKey: SEGMENT_SEARCH_KEY) {
    this.segmentsService.setSearchKey(searchKey);
  }

  setSearchString(searchString: string) {
    this.segmentsService.setSearchString(searchString);
  }

  get displayedColumns(): string[] {
    return SEGMENT_ROOT_DISPLAYED_COLUMNS;
  }

  get SEGMENT_TRANSLATION_KEYS() {
    return SEGMENT_TRANSLATION_KEYS;
  }

  get SEGMENT_ROOT_COLUMN_NAMES() {
    return SEGMENT_ROOT_COLUMN_NAMES;
  }

  get SegmentSearchKey() {
    return SEGMENT_SEARCH_KEY;
  }

  fetchSegmentsOnScroll() {
    this.segmentsService.fetchSegmentsPaginated();
  }

  changeSorting(event) {
    if (event.direction) {
      this.segmentsService.setSortingType(event.direction.toUpperCase());
      this.segmentsService.setSortKey(event.active);
    } else {
      // When sorting is cleared, revert to default sorting
      this.segmentsService.setSortingType(null);
      this.segmentsService.setSortKey(null);
      this.tableContainer.nativeElement.scroll({
        top: 0,
        behavior: 'smooth',
      });
      this.dataSource$.data = this.dataSource$.data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    this.segmentsService.fetchSegmentsPaginated(true);
  }

  isTagsExpanded(segmentId: string): boolean {
    return this.expandedTagsMap?.get(segmentId) || false;
  }

  onTagExpandedChange(segmentId: string, expanded: boolean): void {
    this.tagsExpanded.emit({ segmentId, expanded });
  }
}
