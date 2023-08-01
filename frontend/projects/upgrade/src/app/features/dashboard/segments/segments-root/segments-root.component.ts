import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SegmentsService } from '../../../../core/segments/segments.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { NewSegmentComponent } from '../components/modal/new-segment/new-segment.component';
import { UserPermission } from '../../../../core/auth/store/auth.models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-segments-root',
  templateUrl: './segments-root.component.html',
  styleUrls: ['./segments-root.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentsRootComponent implements OnInit {
  permissions$: Observable<UserPermission>;
  isLoadingSegments$ = this.segmentsService.isInitialSegmentsLoading();
  segments$ = this.segmentsService.allSegments$;

  constructor(private dialog: MatDialog, private segmentsService: SegmentsService, private authService: AuthService) {}

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
