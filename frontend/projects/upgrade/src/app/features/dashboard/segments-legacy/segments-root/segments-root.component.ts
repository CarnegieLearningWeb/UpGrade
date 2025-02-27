import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SegmentsService_LEGACY } from '../../../../core/segments_LEGACY/segments.service._LEGACY';
import { MatDialog } from '@angular/material/dialog';
import { NewSegmentComponent } from '../components/modal/new-segment/new-segment.component';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-segments-root',
  templateUrl: './segments-root.component.html',
  styleUrls: ['./segments-root.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SegmentsRootComponent implements OnInit {
  permissions$: Observable<UserPermission>;
  isLoadingSegments$ = this.segmentsService.isInitialSegmentsLoading();
  segments$ = this.segmentsService.allSegments$;

  constructor(private dialog: MatDialog, private segmentsService: SegmentsService_LEGACY, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.segmentsService.fetchSegments(true);
  }

  openNewSegmentDialog() {
    this.dialog.open(NewSegmentComponent, {
      panelClass: 'new-segment-modal',
    });
  }
}
