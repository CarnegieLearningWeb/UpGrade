import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { AuthService } from '../../../../../core/auth/auth.service';
import { filter } from 'rxjs/operators';
import { FeatureFlag } from '../../../../../core/feature-flags/store/feature-flags.model';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { NewSegmentComponent } from '../../components/modal/new-flag/new-segment.component';
import * as clonedeep from 'lodash.clonedeep';
import { DeleteSegmentComponent } from '../../components/modal/delete-segment/delete-segment.component';

@Component({
  selector: 'segment-view-flag',
  templateUrl: './view-segment.component.html',
  styleUrls: ['./view-segment.component.scss']
})
export class ViewSegmentComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionsSub: Subscription;
  flag: FeatureFlag;
  flagSub: Subscription;
  displayedVariationColumns: string[] = ['variationNumber', 'value', 'name', 'description'];

  constructor(
    private featureFlagsService: FeatureFlagsService,
    private dialog: MatDialog,
    private authService: AuthService) { }

  ngOnInit() {
    this.permissionsSub = this.authService.userPermissions$.subscribe(permission => {
      this.permissions = permission;
    });
    this.flagSub = this.featureFlagsService.selectedFeatureFlag$
      .pipe(filter(flag => !!flag))
      .subscribe(flag => {
        this.flag = flag;
      });
  }

  openEditFlagDialog() {
    const dialogRef = this.dialog.open(NewSegmentComponent as any, {
      panelClass: 'new-segment-modal',
      data: { flagInfo: clonedeep(this.flag) }
    });

    dialogRef.afterClosed().subscribe(() => { });
  }

  deleteFlag() {
    const dialogRef = this.dialog.open(DeleteSegmentComponent, {
      panelClass: 'delete-modal',
      data: { flagName: this.flag.name, flagId: this.flag.id }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Add code of further actions after deleting feature flag
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
