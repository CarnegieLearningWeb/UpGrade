import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { MatTableDataSource, MatSort, MatDialog } from '@angular/material';
import { AuthService } from '../../../../../core/auth/auth.service';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { FeatureFlag } from '../../../../../core/feature-flags/store/feature-flags.model';
import { Segment } from '../../../../../core/segments/store/segments.model';
import { NewSegmentComponent } from '../modal/new-segment/new-segment.component';
import { ImportSegmentComponent } from '../modal/import-segment/import-segment.component';

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
  allFeatureFlags: MatTableDataSource<FeatureFlag>;
  allFeatureFlagsSub: Subscription;
  isLoadingFeatureFlags$ = this.featureFlagsService.isLoadingFeatureFlags$;

  //----
  allSegments: MatTableDataSource<Segment>;
  allSegmentsSub: Subscription;
  isLoadingSegments$ = this.segmentsService.isLoadingSegments$;
  //---

  searchValue: string;
  isAllFlagsFetched = false;
  isAllFlagsFetchedSub: Subscription;

  //---
  isAllSegmentsFetched = false;
  isAllSegmentsFetchedSub: Subscription;
  //--

  @ViewChild('tableContainer', { static: false }) segmentsTableContainer: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private authService: AuthService,
    private featureFlagsService: FeatureFlagsService,
    private segmentsService: SegmentsService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allFeatureFlagsSub = this.featureFlagsService.allFeatureFlags$.subscribe(
      allFeatureFlags => {
        this.allFeatureFlags = new MatTableDataSource();
        this.allFeatureFlags.data = [...allFeatureFlags];
        this.allFeatureFlags.sort = this.sort;
      }
    );

    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe(
      allSegments => {
        this.allSegments = new MatTableDataSource();
        this.allSegments.data = [...allSegments];
        this.allSegments.sort = this.sort;
        console.log(' Fetching all the segments ', this.allSegments.data);
      }
    );

    this.isAllFlagsFetchedSub = this.featureFlagsService.isAllFlagsFetched().subscribe(
      value => this.isAllFlagsFetched = value
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
    this.allFeatureFlagsSub.unsubscribe();
    this.isAllFlagsFetchedSub.unsubscribe();
    this.allSegmentsSub.unsubscribe();
    // this.isAllSegmentsFetchedSub.unsubscribe();
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
