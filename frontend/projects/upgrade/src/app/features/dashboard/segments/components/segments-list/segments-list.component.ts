import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { MatTableDataSource, MatSort, MatDialog } from '@angular/material';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { Segment } from '../../../../../core/segments/store/segments.model';
import { NewSegmentComponent } from '../modal/new-segment/new-segment.component';
import { ImportSegmentComponent } from '../modal/import-segment/import-segment.component';
import { E } from '@angular/cdk/keycodes';
import { CustomMatTableSource } from './CustomMatTableSource';

@Component({
  selector: 'segments-list',
  templateUrl: './segments-list.component.html',
  styleUrls: ['./segments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentsListComponent implements OnInit, OnDestroy, AfterViewInit {
  permissions$: Observable<UserPermission>;
  displayedColumns: string[] = [
    'name',
    'status',
    'lastUpdate',
    'context',
    'description',
    'membersCount',
  ];

  allSegments: MatTableDataSource<Segment>;
  allSegmentsSub: Subscription;
  isLoadingSegments$ = this.segmentsService.isLoadingSegments$;

  isAllSegmentsFetchedSub: Subscription;

  @ViewChild('tableContainer', { static: false }) segmentsTableContainer: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private authService: AuthService,
    private segmentsService: SegmentsService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe(
      allSegments => {
        this.allSegments = new CustomMatTableSource();
        this.allSegments.data = [...allSegments];
        this.allSegments.sort = this.sort;
      }
    );

  }

  openNewSegmentDialog() {
    const dialogRef = this.dialog.open(NewSegmentComponent, {
      panelClass: 'new-segment-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

  openImportSegmentsDialog() {
    const dialogRef = this.dialog.open(ImportSegmentComponent, {
      panelClass: 'import-segment-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

  ngOnDestroy() {
    this.allSegmentsSub.unsubscribe();
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.segmentsTableContainer.nativeElement.style.maxHeight = (windowHeight - 325) + 'px';

    // fromEvent(this.searchInput.nativeElement, 'keyup').pipe(debounceTime(500)).subscribe(searchInput => {
    //   this.setSearchString((searchInput as any).target.value);
    // });
  }
}
