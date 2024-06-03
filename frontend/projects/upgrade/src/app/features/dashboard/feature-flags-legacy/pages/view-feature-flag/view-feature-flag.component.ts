import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../../core/auth/auth.service';
import { filter } from 'rxjs/operators';
import { FeatureFlag } from '../../../../../core/feature-flags/store/feature-flags.model';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { NewFlagComponent } from '../../components/modal/new-flag/new-flag.component';
import * as clonedeep from 'lodash.clonedeep';
import { DeleteFlagComponent } from '../../components/modal/delete-flag/delete-flag.component';

@Component({
  selector: 'feature-flag-view-flag',
  templateUrl: './view-feature-flag.component.html',
  styleUrls: ['./view-feature-flag.component.scss'],
})
export class ViewFeatureFlagComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionsSub: Subscription;
  flag: FeatureFlag;
  flagSub: Subscription;
  displayedVariationColumns: string[] = ['variationNumber', 'value', 'name', 'description'];

  constructor(
    private featureFlagsService: FeatureFlagsService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissionsSub = this.authService.userPermissions$.subscribe((permission) => {
      this.permissions = permission;
    });
    this.flagSub = this.featureFlagsService.selectedFeatureFlag$.pipe(filter((flag) => !!flag)).subscribe((flag) => {
      this.flag = flag;
    });
  }

  openEditFlagDialog() {
    this.dialog.open(NewFlagComponent as any, {
      panelClass: 'new-flag-modal',
      data: { flagInfo: clonedeep(this.flag) },
    });
  }

  deleteFlag() {
    this.dialog.open(DeleteFlagComponent, {
      panelClass: 'delete-modal',
      data: { flagName: this.flag.name, flagId: this.flag.id },
    });
  }

  getActiveVariation(flag: FeatureFlag) {
    return this.featureFlagsService.getActiveVariation(flag);
  }

  changeFlagStatus(flagId: string, event: any) {
    this.featureFlagsService.updateFeatureFlagStatus(flagId, event.checked);
  }

  ngOnDestroy() {
    this.flagSub.unsubscribe();
    this.permissionsSub.unsubscribe();
  }
}
