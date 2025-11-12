import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { BehaviorSubject, Observable, Subscription, combineLatest, map } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-delete-experiment-modal',
  imports: [CommonModalComponent, MatInputModule, FormsModule, TranslateModule, CommonModule, SharedModule],
  templateUrl: './delete-experiment-modal.component.html',
  styleUrl: './delete-experiment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteExperimentModalComponent {
  selectedExperiment$ = this.experimentService.selectedExperiment$;
  inputValue = '';
  subscriptions = new Subscription();
  isLoadingExperimentDelete$ = this.experimentService.isLoadingExperimentDelete$;
  private readonly inputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  // Observable that emits true if inputValue is 'delete', false otherwise
  isDeleteNotTyped$: Observable<boolean> = this.inputSubject.pipe(
    map((value) => value.trim().toLowerCase() !== 'delete')
  );

  isDeleteActionBtnDisabled$: Observable<boolean> = combineLatest([
    this.isDeleteNotTyped$,
    this.isLoadingExperimentDelete$,
  ]).pipe(map(([isDeleteNotTyped, isLoading]) => isDeleteNotTyped || isLoading));

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig,
    public dialog: MatDialog,
    private readonly experimentService: ExperimentService,
    public dialogRef: MatDialogRef<DeleteExperimentModalComponent>
  ) {}

  onInputChange(value: string): void {
    this.inputSubject.next(value);
  }

  onPrimaryActionBtnClicked(experimentId: string) {
    this.experimentService.deleteExperiment(experimentId);
    this.dialogRef.close();
  }
}
