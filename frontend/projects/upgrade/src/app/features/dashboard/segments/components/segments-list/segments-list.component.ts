import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Observable, Subscription, fromEvent } from 'rxjs';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { MatTableDataSource, MatSort, MatDialog } from '@angular/material';
import { AuthService } from '../../../../../core/auth/auth.service';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { FeatureFlag, FLAG_SEARCH_SORT_KEY } from '../../../../../core/feature-flags/store/feature-flags.model';
import { Segment } from '../../../../../core/segments/store/segments.model';
import { NewSegmentComponent } from '../modal/new-flag/new-segment.component';
import { debounceTime } from 'rxjs/operators';

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
  membersCount: number;
  //---

  selectedSegmentsFilterOption = FLAG_SEARCH_SORT_KEY.ALL;
  searchValue: string;
  isAllFlagsFetched = false;
  isAllFlagsFetchedSub: Subscription;

  //---
  isAllSegmentsFetched = false;
  isAllSegmentsFetchedSub: Subscription;
  //--

  @ViewChild('tableContainer', { static: false }) featureFlagsTableContainer: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private authService: AuthService,
    private featureFlagsService: FeatureFlagsService,
    private segmentsService: SegmentsService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.membersCount = 0;
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

    // if(this.allSegments.data) {
    //   this.allSegments.data.forEach((e) => {
    //     let x = e.groupForSegment.length + e.individualForSegment.length + e.subSegments.length;
    //     e = {...e, x};
    //   });
    //   this.membersCount = this.allSegments.data.group
    // }
    // this.isAllSegmentsFetchedSub = this.segmentsService.isAllSegmentsFetched().subscribe(
    //   value => this.isAllFlagsFetched = value
    // );

    if(this.allSegments.data[0]) {
      const membersCount = this.allSegments.data[0].groupForSegment.length + 
      this.allSegments.data[0].individualForSegment.length + 
      this.allSegments.data[0].subSegments.length;
      console.log(' the memberName  ', this.allSegments.data[0]);
      console.log(' -------------------- membersCount-------------------', membersCount);
    }

  }

  openNewSegmentDialog() {
    const dialogRef = this.dialog.open(NewSegmentComponent, {
      panelClass: 'new-segment-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

  // Modify angular material's table's default search behavior
  // filterFlagsPredicate(type: FLAG_SEARCH_SORT_KEY) {
  //   this.allFeatureFlags.filterPredicate = (data, filter: string): boolean => {
  //     switch (type) {
  //       case FLAG_SEARCH_SORT_KEY.ALL:
  //         return (
  //           data.name.toLocaleLowerCase().includes(filter) ||
  //           (data.status + '').toLocaleLowerCase().includes(filter) ||
  //           data.key.toLocaleLowerCase().includes(filter) ||
  //           data.variationType.toLocaleLowerCase().includes(filter) ||
  //           this.isVariationFound(data, filter)
  //         );
  //       case FLAG_SEARCH_SORT_KEY.NAME:
  //         return data.name.toLowerCase().includes(filter) || this.isVariationFound(data, filter);
  //       case FLAG_SEARCH_SORT_KEY.STATUS:
  //         return (data.status + '').toLowerCase().includes(filter);
  //       case FLAG_SEARCH_SORT_KEY.KEY:
  //         return data.key.toLowerCase().includes(filter);
  //       case FLAG_SEARCH_SORT_KEY.VARIATION_TYPE:
  //         return data.variationType.toLowerCase().includes(filter);
  //     }
  //   };
  // }

  // Used to search based on variation value
  isVariationFound(data: FeatureFlag, filterValue: string): boolean {
    const isVariationFound = data.variations.filter(
      variation => variation.value.includes(filterValue)
    );
    return !!isVariationFound.length;
  }

  changeSorting(event) {
    this.featureFlagsService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.featureFlagsService.setSortKey(event.direction ? event.active : null);
    this.featureFlagsTableContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth'
    });
    this.featureFlagsService.fetchFeatureFlags(true);
  }

  fetchFlagsOnScroll() {
    if (!this.isAllFlagsFetched) {
      this.featureFlagsService.fetchFeatureFlags();
    }
    // if (!this.isAllSegmentsFetched) {
    //   this.segmentsService.fetchSegments();
    // }
  }

  ngOnDestroy() {
    this.allFeatureFlagsSub.unsubscribe();
    this.isAllFlagsFetchedSub.unsubscribe();

    this.featureFlagsService.setSearchString(null);
    this.featureFlagsService.setSearchKey(FLAG_SEARCH_SORT_KEY.ALL);
    this.featureFlagsService.setSortKey(null);
    this.featureFlagsService.setSortingType(null);

    this.allSegmentsSub.unsubscribe();
    // this.isAllSegmentsFetchedSub.unsubscribe();
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.featureFlagsTableContainer.nativeElement.style.maxHeight = (windowHeight - 325) + 'px';

    // fromEvent(this.searchInput.nativeElement, 'keyup').pipe(debounceTime(500)).subscribe(searchInput => {
    //   this.setSearchString((searchInput as any).target.value);
    // });
  }
}
