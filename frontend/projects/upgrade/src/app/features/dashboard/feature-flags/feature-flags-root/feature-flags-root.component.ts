import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FeatureFlagsService } from '../../../../core/feature-flags/feature-flags.service';
import { MatDialog } from '@angular/material/dialog';
import { NewFlagComponent } from '../components/modal/new-flag/new-flag.component';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-feature-flags-root',
  templateUrl: './feature-flags-root.component.html',
  styleUrls: ['./feature-flags-root.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagsRootComponent implements OnInit {
  permissions$: Observable<UserPermission>;
  isLoadingFeatureFlags$ = this.featureFlagsService.isInitialFeatureFlagsLoading();
  featureFlags$ = this.featureFlagsService.allFeatureFlags$;
  constructor(
    private featureFlagsService: FeatureFlagsService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.featureFlagsService.fetchFeatureFlags(true);
  }

  openNewFlagDialog() {
    this.dialog.open(NewFlagComponent, {
      panelClass: 'new-flag-modal',
    });
  }
}
