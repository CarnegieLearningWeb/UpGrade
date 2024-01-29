import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { Segment } from '../../../../../core/segments/store/segments.model';
import { NewSegmentComponent } from '../modal/new-segment/new-segment.component';
import { ImportSegmentComponent } from '../modal/import-segment/import-segment.component';
import { CustomMatTableSource } from './CustomMatTableSource';
import { EXPERIMENT_SEARCH_KEY } from '../../../../../core/experiments/store/experiments.model';
import { SegmentStatusPipeType } from '../../../../../shared/pipes/segment-status.pipe';
import { SEGMENT_STATUS } from '../../../../../core/segments/store/segments.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { ExportSegmentComponent } from '../../components/modal/export-segment/export-segment.component';

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
  isLoadingSegments$ = this.segmentsService.isLoadingSegments$;
  experimentFilterOptions = [
    EXPERIMENT_SEARCH_KEY.ALL,
    EXPERIMENT_SEARCH_KEY.NAME,
    EXPERIMENT_SEARCH_KEY.STATUS,
    EXPERIMENT_SEARCH_KEY.CONTEXT,
  ];
  selectedExperimentFilterOption = EXPERIMENT_SEARCH_KEY.ALL;
  searchValue: string;

  constructor(private authService: AuthService, private segmentsService: SegmentsService, private dialog: MatDialog) {}

  get SegmentStatus() {
    return SEGMENT_STATUS;
  }

  get SegmentStatusPipeTypes() {
    return SegmentStatusPipeType;
  }

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe((allSegments) => {
      allSegments = allSegments.map((segment) => ({ ...segment, status: segment.status || SEGMENT_STATUS.UNUSED }));
      this.allSegments = new CustomMatTableSource();
      this.allSegments.data = [...allSegments];
      this.allSegments.sort = this.sort;
    });
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
  }
}
