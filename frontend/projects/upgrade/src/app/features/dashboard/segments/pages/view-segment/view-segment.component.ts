import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { AuthService } from '../../../../../core/auth/auth.service';
import { filter } from 'rxjs/operators';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { NewSegmentComponent } from '../../components/modal/new-flag/new-segment.component';
import * as clonedeep from 'lodash.clonedeep';
import { DeleteSegmentComponent } from '../../components/modal/delete-segment/delete-segment.component';
import { Segment } from '../../../../../core/segments/store/segments.model';

@Component({
  selector: 'segment-view-flag',
  templateUrl: './view-segment.component.html',
  styleUrls: ['./view-segment.component.scss']
})
export class ViewSegmentComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionsSub: Subscription;
  segment: any;
  segmentSub: Subscription;
  members: {type: string, id: string}[] = [];
  
  displayedVariationColumns: string[] = ['variationNumber', 'value', 'name'];

  constructor(
    private segmentsService: SegmentsService,
    private dialog: MatDialog,
    private authService: AuthService) { }

  ngOnInit() {
    this.permissionsSub = this.authService.userPermissions$.subscribe(permission => {
      this.permissions = permission;
    });

    this.segmentSub = this.segmentsService.selectedSegment$
      .pipe(filter(segment => !!segment))
      .subscribe(segment => {
        this.segment = segment;
    });

    if (this.segment) {
      this.segment.individualForSegment.forEach(user => {
        this.members.push({type: 'Individual', id: user.userId})
      });

      this.segment.groupForSegment.forEach(group => {
        this.members.push({type: group.type, id: group.groupId})
      });

      this.segment.subSegments.forEach(subSegment => {
        this.members.push({type: 'Segment', id: subSegment.name})
      });
    }
  }

  openEditSegmentDialog() {
    const dialogRef = this.dialog.open(NewSegmentComponent as any, {
      panelClass: 'new-segment-modal',
      data: { segmentInfo: clonedeep(this.segment) }
    });

    dialogRef.afterClosed().subscribe(() => { });
  }

  deleteSegment() {
    const dialogRef = this.dialog.open(DeleteSegmentComponent, {
      panelClass: 'delete-modal',
      data: { segmentName: this.segment.name, segmentId: this.segment.id }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Add code of further actions after deleting feature segment
    });
  }

  duplicateSegmentDialog() {
  }

  exportSegment(segmentId: string) {
    // this.experimentService.exportExperimentDesign(experimentId);
    // this.openSnackBar(false);
  }

  ngOnDestroy() {
    this.segmentSub.unsubscribe();
    this.permissionsSub.unsubscribe();
  }
}
