import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { BehaviorSubject, Observable, Subscription, combineLatest, map } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';

@Component({
  selector: 'app-delete-segment-modal',
  imports: [CommonModalComponent, MatInputModule, FormsModule, TranslateModule, CommonModule],
  templateUrl: './delete-segment-modal.component.html',
  styleUrl: './delete-segment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteSegmentModalComponent {
  selectedSegment$ = this.segmentsService.selectedSegment$;
  inputValue = '';
  subscriptions = new Subscription();
  isLoadingSegmentDelete$ = this.segmentsService.isLoadingSegments$;
  private inputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  // Observable that emits true if inputValue is 'delete', false otherwise
  isDeleteNotTyped$: Observable<boolean> = this.inputSubject.pipe(map((value) => value.toLowerCase() !== 'delete'));

  isDeleteActionBtnDisabled$: Observable<boolean> = combineLatest([
    this.isDeleteNotTyped$,
    this.isLoadingSegmentDelete$,
  ]).pipe(map(([isDeleteNotTyped, isLoading]) => isDeleteNotTyped || isLoading));

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig,
    public dialog: MatDialog,
    private segmentsService: SegmentsService,
    public dialogRef: MatDialogRef<DeleteSegmentModalComponent>
  ) {}

  onInputChange(value: string): void {
    this.inputSubject.next(value);
  }

  onPrimaryActionBtnClicked(segmentId: string) {
    this.segmentsService.deleteSegment(segmentId);
    this.dialogRef.close();
  }
}
