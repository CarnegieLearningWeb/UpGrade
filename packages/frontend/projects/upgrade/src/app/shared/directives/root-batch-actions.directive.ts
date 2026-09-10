import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, Subscription, map, shareReplay } from 'rxjs';
import { BatchDeleteEntity, IMenuButtonItem } from 'upgrade_types';
import { BatchFacade } from '../../core/batch-actions/batch-actions.facade';
import { selectionView } from '../../core/batch-actions/batch-actions.helpers';
import { RootBatchState } from '../../core/batch-actions/batch-actions.models';
import { DialogService } from '../services/common-dialog.service';
import { CommonBatchDeleteModalComponent } from '../../shared-standalone-component-lib/components/common-batch-delete-modal/common-batch-delete-modal.component';

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
        label: `batch-delete.menu.${entity}.${selection.selectedCount === 1 ? 'one' : 'other'}`,
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
  private dialogRef?: MatDialogRef<CommonBatchDeleteModalComponent>;
  private destroyed = false;

  constructor(private dialogs: DialogService, private host: ElementRef<HTMLElement>) {}

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
        this.dialogRef = ref;
        this.subscriptions.add(
          ref.afterClosed().subscribe(() => {
            this.dialogRef = undefined;
            this.batchFacade.dismissConfirmation();
            if (!this.destroyed) {
              const target = this.host.nativeElement.querySelector<HTMLElement>(
                '.section-card-menu-trigger:not(:disabled), .batch-name-sort .mat-sort-header-container'
              );
              target?.focus();
            }
          })
        );
      })
    );
  }

  requestDelete() {
    this.batchFacade.prepareConfirmation();
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.subscriptions.unsubscribe();
    this.dialogRef?.close();
    this.batchFacade.dismissConfirmation();
  }
}
