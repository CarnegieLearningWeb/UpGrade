import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Observable, Subscription, combineLatest, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { Segment } from '../../../../../core/segments/store/segments.model';
import { NewSegmentComponent } from '../modal/new-segment/new-segment.component';
import { ImportSegmentComponent } from '../modal/import-segment/import-segment.component';
import { SegmentStatusPipeType } from '../../../../../shared/pipes/segment-status.pipe';
import { SEGMENT_STATUS } from '../../../../../core/segments/store/segments.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { ExportSegmentComponent } from '../../components/modal/export-segment/export-segment.component';
import { SEGMENT_SEARCH_KEY } from '../../../../../../../../../../types/src/Experiment/enums';
import { CustomMatTableSource } from './CustomMatTableSource';

@Component({
  selector: 'segments-list',
  templateUrl: './segments-list.component.html',
  styleUrls: ['./segments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentsListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('tableContainer', { static: false }) segmentsTableContainer: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  permissions$: Observable<UserPermission>;
  displayedColumns: string[] = ['name', 'status', 'lastUpdate', 'context', 'description', 'membersCount'];

  allSegments: MatTableDataSource<Segment>;
  allSegmentsSub: Subscription;
  segmentSortKey$: Observable<string>;
  segmentSortAs$: Observable<string>;
  isLoadingSegments$ = this.segmentsService.isLoadingSegments$;
  segmentFilterOptions = [
    SEGMENT_SEARCH_KEY.ALL,
    SEGMENT_SEARCH_KEY.NAME,
    SEGMENT_SEARCH_KEY.STATUS,
    SEGMENT_SEARCH_KEY.CONTEXT,
  ];
  statusFilterOptions = Object.values(SEGMENT_STATUS);
  selectedSegmentFilterOption = SEGMENT_SEARCH_KEY.ALL;
  searchValue: string;
  contextVisibility = [];

  constructor(
    private authService: AuthService,
    private segmentsService: SegmentsService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;

    this.segmentSortKey$ = this.segmentsService.selectSegmentSortKey$;
    this.segmentSortAs$ = this.segmentsService.selectSegmentSortAs$;

    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe((segments) => {
      segments = segments.map((segment) => ({ ...segment, status: segment.status || SEGMENT_STATUS.UNUSED }));
      this.allSegments = new CustomMatTableSource();
      this.allSegments.data = [...segments];
      this.allSegments.sort = this.sort;
      this.cdr.detectChanges();
      this.applyFilter(this.searchValue);
    });

    this.segmentsService.selectSearchSegmentParams().subscribe((searchParams: any) => {
      // Used when user clicks on context from view segment page
      this.searchValue = searchParams.searchString;
      this.selectedSegmentFilterOption = searchParams.searchKey;
      this.applyFilter(searchParams.searchString);
    });
  }

  filterSegmentPredicate(type: SEGMENT_SEARCH_KEY) {
    this.allSegments.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case SEGMENT_SEARCH_KEY.ALL:
          return (
            data.name.toLocaleLowerCase().includes(filter) ||
            data.status.toLocaleLowerCase().includes(filter) ||
            data.context.toLocaleLowerCase().includes(filter)
          );
        case SEGMENT_SEARCH_KEY.NAME:
          return data.name.toLocaleLowerCase().includes(filter);
        case SEGMENT_SEARCH_KEY.STATUS:
          return data.status.toLocaleLowerCase().includes(filter);
        case SEGMENT_SEARCH_KEY.CONTEXT:
          return data.context.toLocaleLowerCase().includes(filter);
      }
    };
  }

  get filteredStatusOptions(): string[] {
    if (typeof this.searchValue === 'string') {
      const filterValue = this.searchValue.toLowerCase();
      return this.statusFilterOptions.filter((option) => option.toLowerCase().includes(filterValue));
    } else {
      return this.statusFilterOptions;
    }
  }

  applyFilter(filterValue: string) {
    this.filterSegmentPredicate(this.selectedSegmentFilterOption);
    if (typeof filterValue === 'string') {
      this.allSegments.filter = filterValue.trim().toLowerCase();
    }
  }

  setSearchKey(searchKey: SEGMENT_SEARCH_KEY) {
    this.segmentsService.setSearchKey(searchKey);
  }

  setSearchString(searchString: string) {
    this.segmentsService.setSearchString(searchString);
  }

  changeSorting(event) {
    this.segmentsService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.segmentsService.setSortKey(event.direction ? event.active : null);
    this.segmentsTableContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth',
    });
  }

  filterSegmentsByChips(tagValue: string, type: SEGMENT_SEARCH_KEY) {
    this.setSearchKey(type);
    this.setSearchString(tagValue);
  }

  openNewSegmentDialog() {
    this.dialog.open(NewSegmentComponent, {
      panelClass: 'new-segment-modal',
    });
  }

  openImportSegmentsDialog() {
    this.dialog.open(ImportSegmentComponent, {
      panelClass: 'import-segment-modal',
    });
  }

  openExportAllSegment() {
    this.dialog.open(ExportSegmentComponent, {
      panelClass: 'export-modal',
      data: { segment: this.allSegments.data },
    });
  }

  ngOnDestroy() {
    this.allSegmentsSub.unsubscribe();
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.segmentsTableContainer.nativeElement.style.maxHeight = windowHeight - 325 + 'px';

    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(debounceTime(500))
      .subscribe((searchInput) => {
        this.setSearchString((searchInput as any).target.value);
      });
  }

  get SegmentSearchKey() {
    return SEGMENT_SEARCH_KEY;
  }

  get SegmentStatus() {
    return SEGMENT_STATUS;
  }

  get SegmentStatusPipeTypes() {
    return SegmentStatusPipeType;
  }
}
