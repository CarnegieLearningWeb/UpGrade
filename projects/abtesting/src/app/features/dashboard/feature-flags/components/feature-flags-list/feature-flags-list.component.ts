import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { MatTableDataSource, MatSort, MatPaginator, MatDialog } from '@angular/material';
import { AuthService } from '../../../../../core/auth/auth.service';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { FeatureFlag } from '../../../../../core/feature-flags/store/feature-flags.model';
import { NewFlagComponent } from '../modal/new-flag/new-flag.component';

@Component({
  selector: 'feature-flags-list',
  templateUrl: './feature-flags-list.component.html',
  styleUrls: ['./feature-flags-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureFlagsListComponent implements OnInit, OnDestroy, AfterViewInit {
  permissions$: Observable<UserPermission>;
  displayedColumns: string[] = [
    'name',
    'key',
    'variationType',
    'activeVariant',
    'status',
  ];
  allFeatureFlags: MatTableDataSource<FeatureFlag>;
  allFeatureFlagsSub: Subscription;
  isLoadingFeatureFlags$ = this.featureFlagsService.isLoadingFeatureFlags$;
  @ViewChild('tableContainer', { static: false }) featureFlagsTableContainer: ElementRef;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private authService: AuthService,
    private featureFlagsService: FeatureFlagsService,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allFeatureFlagsSub = this.featureFlagsService.allFeatureFlags$.subscribe(
      allFeatureFlags => {
        this.allFeatureFlags = new MatTableDataSource();
        this.allFeatureFlags.data = [...allFeatureFlags];
        this.allFeatureFlags.paginator = this.paginator;
        this.allFeatureFlags.sort = this.sort;
      }
    );
  }

  openNewFlagDialog() {
    const dialogRef = this.dialog.open(NewFlagComponent, {
      panelClass: 'new-flag-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

  // TODO: Update experiment filter logic
  applyFilter(filterValue: string) {
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

  ngOnDestroy() {
    this.allFeatureFlagsSub.unsubscribe();
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.featureFlagsTableContainer.nativeElement.style.maxHeight = (windowHeight - 350) + 'px';
  }
}
