import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FeatureFlagsService } from '../../../../core/feature-flags/feature-flags.service';
import { MatDialog } from '@angular/material';
import { NewSegmentComponent } from '../components/modal/new-flag/new-segment.component';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-segments-root',
  templateUrl: './segments-root.component.html',
  styleUrls: ['./segments-root.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentsRootComponent implements OnInit {
  permissions$: Observable<UserPermission>;
  isLoadingSegments$ = this.featureFlagsService.isInitialFeatureFlagsLoading();
  segments$ = this.featureFlagsService.allFeatureFlags$;
  constructor(
    private featureFlagsService: FeatureFlagsService,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.featureFlagsService.fetchFeatureFlags(true);
  }

  openNewSegmentDialog() {
    const dialogRef = this.dialog.open(NewSegmentComponent, {
      panelClass: 'new-segment-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

}
