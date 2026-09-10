import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BatchDeleteEntity } from 'upgrade_types';
import { BatchFacade } from '../../../core/batch-actions/batch-actions.facade';
import { BatchDeleteSnapshot, RootBatchState } from '../../../core/batch-actions/batch-actions.models';
import { batchResultCounts } from '../../../core/batch-actions/batch-actions.helpers';
import { CommonModalComponent } from '../common-modal/common-modal.component';

export interface BatchDeleteModalData {
  entity: BatchDeleteEntity;
  snapshot: BatchDeleteSnapshot;
  facade: BatchFacade;
}

@Component({
  selector: 'app-common-batch-delete-modal',
  imports: [CommonModalComponent, FormsModule, MatInputModule, MatProgressBarModule, TranslateModule],
  templateUrl: './common-batch-delete-modal.component.html',
  styleUrl: './common-batch-delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonBatchDeleteModalComponent {
  inputValue = '';
  busy = false;
  complete = false;
  stale = false;
  reconciling = false;
  counts: ReturnType<typeof batchResultCounts>;
  resultItems: { id: string; name: string; messageKey: string }[] = [];
  private state: RootBatchState;
  private submitted = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BatchDeleteModalData,
    public dialogRef: MatDialogRef<CommonBatchDeleteModalComponent>,
    changeDetector: ChangeDetectorRef,
    destroyRef: DestroyRef
  ) {
    data.facade.state$.pipe(takeUntilDestroyed(destroyRef)).subscribe((state) => {
      this.state = state;
      const operation = state.operation?.snapshot.operationId === data.snapshot.operationId ? state.operation : null;
      this.busy = operation?.status === 'submitting' || operation?.status === 'reconciling';
      this.reconciling = operation?.status === 'reconciling';
      this.complete = operation?.status === 'complete';
      this.stale = !operation && state.confirmation?.operationId !== data.snapshot.operationId;
      this.dialogRef.disableClose = this.busy;
      if (this.complete) {
        this.counts = batchResultCounts(state);
        const fullSuccess =
          operation.result?.results.length === data.snapshot.items.length &&
          operation.result.results.every((item) => item.outcome === 'deleted' && !item.reasonCode);
        if (fullSuccess) {
          this.dialogRef.close(true);
        } else {
          const results = new Map(operation.result?.results.map((item) => [item.id, item]));
          this.resultItems = data.snapshot.items.map(({ id, name }) => {
            const result = results.get(id);
            return {
              id,
              name: name || id,
              messageKey: operation.reconciledAbsentIds.includes(id)
                ? 'batch-delete.outcome.reconciled-absent'
                : result?.reasonCode
                ? `batch-delete.reason.${result.reasonCode}`
                : `batch-delete.outcome.${result?.outcome || 'unknown'}`,
            };
          });
        }
      }
      changeDetector.markForCheck();
    });
  }

  get titleKey() {
    return `batch-delete.dialog.${this.data.entity}.title`;
  }
  get messageKey() {
    return `batch-delete.dialog.${this.data.entity}.${this.data.snapshot.items.length === 1 ? 'one' : 'other'}`;
  }
  get canSubmit() {
    return (
      !this.submitted &&
      !this.busy &&
      !this.complete &&
      !this.stale &&
      this.inputValue.trim().toLowerCase() === 'delete' &&
      this.state.confirmation?.operationId === this.data.snapshot.operationId
    );
  }

  submit() {
    if (!this.canSubmit) return;
    this.submitted = true;
    this.data.facade.submit(this.data.snapshot.operationId);
  }
}
