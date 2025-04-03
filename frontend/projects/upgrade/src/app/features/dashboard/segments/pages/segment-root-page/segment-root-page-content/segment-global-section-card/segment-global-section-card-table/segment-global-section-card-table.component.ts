import { Observable } from 'rxjs';

import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { CommonStatusIndicatorChipComponent } from '../../../../../../../../shared-standalone-component-lib/components';
import { SegmentsService } from '../../../../../../../../core/segments/segments.service';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import {
  Segment,
  SEGMENT_ROOT_COLUMN_NAMES,
  SEGMENT_ROOT_DISPLAYED_COLUMNS,
  SEGMENT_TRANSLATION_KEYS,
} from '../../../../../../../../core/segments/store/segments.model';

@Component({
  selector: 'app-segment-global-section-card-table',
  imports: [MatTableModule, AsyncPipe, NgIf, NgFor, SharedModule, RouterModule, CommonStatusIndicatorChipComponent],
  templateUrl: './segment-global-section-card-table.component.html',
  styleUrl:
    '../../segment-root-section-card/segment-root-section-card-table/segment-root-section-card-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentGlobalSectionCardTableComponent implements OnInit {
  @Input() dataSource$: MatTableDataSource<Segment>;
  @Input() isLoading$: Observable<boolean>;
  segmentSortKey$ = this.segmentsService.selectGlobalSegmentSortKey$;
  segmentSortAs$ = this.segmentsService.selectGlobalSegmentSortAs$;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('tableContainer') tableContainer: ElementRef;

  constructor(private segmentsService: SegmentsService) {}

  ngOnInit() {
    this.sortTable();
  }

  ngOnChanges() {
    this.sortTable();
  }

  private sortTable() {
    if (this.dataSource$?.data) {
      this.dataSource$.sortingDataAccessor = (item, property) =>
        property === 'name' ? item.name.toLowerCase() : item[property];
      this.dataSource$.sort = this.sort;
    }
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

  changeSorting(event) {
    if (event.direction) {
      this.segmentsService.setGlobalSortingType(event.direction.toUpperCase());
      this.segmentsService.setGlobalSortKey(event.active);
    } else {
      // When sorting is cleared, revert to default sorting
      this.segmentsService.setGlobalSortingType(null);
      this.segmentsService.setGlobalSortKey(null);
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
