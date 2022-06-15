import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { AuthService } from '../../../../../core/auth/auth.service';
import { filter } from 'rxjs/operators';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { NewSegmentComponent } from '../../components/modal/new-segment/new-segment.component';
import * as clonedeep from 'lodash.clonedeep';
import { DeleteSegmentComponent } from '../../components/modal/delete-segment/delete-segment.component';
import { DuplicateSegmentComponent } from '../../components/modal/duplicate-segment/duplicate-segment.component';
import { MemberTypes, Segment } from '../../../../../core/segments/store/segments.model';
import { SEGMENT_TYPE } from 'upgrade_types';
import { DeleteComponent } from '../../../../../shared/components/delete/delete.component';
import { SegmentExperimentListComponent } from '../../components/modal/segment-experiment-list/segment-experiment-list.component';
@Component({
  selector: 'view-segment',
  templateUrl: './view-segment.component.html',
  styleUrls: ['./view-segment.component.scss']
})
export class ViewSegmentComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionsSub: Subscription;
  segment: Segment;
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

        if(this.segment.type === SEGMENT_TYPE.GLOBAL_EXCLUDE)
          this.permissions.segments.delete = false;
        this.members = [];
        this.segment.individualForSegment.forEach(user => {
          this.members.push({type: MemberTypes.INDIVIDUAL, id: user.userId});
        });
        this.segment.groupForSegment.forEach(group => {
          this.members.push({type: group.type, id: group.groupId});
        });
        this.segment.subSegments.forEach(subSegment => {
          this.members.push({type: MemberTypes.SEGMENT, id: subSegment.name});
        });
    });
  }

  openEditSegmentDialog() {
    const dialogRef = this.dialog.open(NewSegmentComponent as any, {
      panelClass: 'new-segment-modal',
      data: { segmentInfo: clonedeep(this.segment) }
    });

    dialogRef.afterClosed().subscribe(() => { });
  }

  deleteSegment() {
    const dialogRef = this.dialog.open(DeleteComponent, {
      panelClass: 'delete-modal'
    });

    dialogRef.afterClosed().subscribe(isDeleteButtonClicked => {
      if (isDeleteButtonClicked) {
        this.segmentsService.deleteSegment(this.segment.id);
        // Add code of further actions after deleting experiment
      }
    });
  }

  duplicateSegmentDialog() {
    const dialogRef = this.dialog.open(DuplicateSegmentComponent, {
      panelClass: 'duplicate-segment-modal',
      data: { segment: this.segment }
    });
    dialogRef.afterClosed().subscribe(() => {
      // Add code of further actions after deleting feature segment
    });
  }

  openExperimentSegmentList() {
    const dialogRef = this.dialog.open(SegmentExperimentListComponent, {
      panelClass: 'segment-experiment-list-modal',
      data: { segment: this.segment }
    });
    dialogRef.afterClosed().subscribe(() => {
      // Add code of further actions after deleting feature segment
    });
  }

  exportSegment(segmentId: string) {
    this.segmentsService.exportSegment(segmentId);
  }

  ngOnDestroy() {
    this.segmentSub.unsubscribe();
    this.permissionsSub.unsubscribe();
  }
}
