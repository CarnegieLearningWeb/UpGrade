import { Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, Subscription, map, shareReplay } from 'rxjs';
import { BatchDeleteEntity, IMenuButtonItem } from 'upgrade_types';
import { BatchFacade } from '../../core/batch-actions/batch-actions.facade';
import { selectionView } from '../../core/batch-actions/batch-actions.helpers';
import { RootBatchState } from '../../core/batch-actions/batch-actions.models';
import { DialogService } from '../services/common-dialog.service';
import { CommonSimpleTextValidatedConfirmationModalComponent } from '../../shared-standalone-component-lib/components/common-simple-text-validated-confirmation-modal/common-simple-text-validated-confirmation-modal.component';

export function rootBatchView(state: RootBatchState, entity: BatchDeleteEntity) {
  const selection = selectionView(state, entity);
  const messageKey = selection.busy
    ? 'batch-delete.selection.busy'
    : selection.reasonCode
    ? `batch-delete.reason.${selection.reasonCode}`
    : '';
  return {
    ...selection,
    state,
    messageKey,
    menuDisabled: !selection.canRequestConfirmation || !!messageKey,
    menuItems: [
      {
        label: `batch-delete.dialog.${entity}.title`,
        action: 'batch-delete',
        disabled: false,
      },
    ] as IMenuButtonItem[],
  };
}

export type RootBatchView = ReturnType<typeof rootBatchView>;

/** Connect root-card controls to one confirmation dialog without owning the deletion request. */
@Directive({ selector: '[appRootBatchActions]', exportAs: 'rootBatchActions' })
export class RootBatchActionsDirective implements OnInit, OnDestroy {
  @Input() batchFacade: BatchFacade;
  @Input() batchEntity: BatchDeleteEntity;
  @Input() batchExpandedTags: Map<string, boolean>;
  view$: Observable<RootBatchView>;
  private subscriptions = new Subscription();
  private dialogRef?: MatDialogRef<CommonSimpleTextValidatedConfirmationModalComponent, boolean>;
  constructor(private dialogs: DialogService) {}

  ngOnInit() {
    this.view$ = this.batchFacade.state$.pipe(
      map((state) => rootBatchView(state, this.batchEntity)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.subscriptions.add(
      this.batchFacade.state$.subscribe((state) => {
        state.removedIds.forEach((id) => this.batchExpandedTags?.delete(id));
        if (!state.confirmation || this.dialogRef) return;
        const ref = this.dialogs.openBatchDeleteModal(this.batchEntity, state.confirmation, this.batchFacade);
        const operationId = state.confirmation.operationId;
        this.dialogRef = ref;
        this.subscriptions.add(
          ref.afterClosed().subscribe((confirmed) => {
            this.dialogRef = undefined;
            if (confirmed) this.batchFacade.submit(operationId);
            this.batchFacade.dismissConfirmation();
          })
        );
      })
    );
  }

  requestDelete() {
    this.batchFacade.prepareConfirmation();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.dialogRef?.close();
    this.batchFacade.leaveRootPage();
  }
}
