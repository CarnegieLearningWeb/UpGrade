import { Store, select } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { BatchDeleteEntity } from 'upgrade_types';
import { RootBatchActions } from './batch-actions.actions';
import { RootBatchState, newBatchRequestId } from './batch-actions.models';
import { selectionItem, selectionView } from './batch-actions.helpers';

/** Entity facades expose this same interface to root tables and the shared confirmation dialog. */
export function createBatchFacade(
  store: Store,
  entity: BatchDeleteEntity,
  actions: RootBatchActions,
  selectState: (state: any) => RootBatchState,
  selectRows: (state: any) => { id?: string; name?: string }[]
) {
  const state$ = store.pipe(select(selectState));
  return {
    state$,
    selection$: state$.pipe(map((state) => selectionView(state, entity))),
    toggleRow: (row: Parameters<typeof selectionItem>[0]) =>
      store.dispatch(actions.toggleRow({ item: selectionItem(row) })),
    toggleHeader: () =>
      store
        .pipe(select(selectRows), take(1))
        .subscribe((rows) => store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }))),
    leaveRootPage: () => store.dispatch(actions.rootPageLeft()),
    prepareConfirmation: () => store.dispatch(actions.prepareConfirmation({ operationId: newBatchRequestId() })),
    dismissConfirmation: () => store.dispatch(actions.dismissConfirmation()),
    submit: (operationId: string) =>
      state$.pipe(take(1)).subscribe((state) => {
        if (state.confirmation?.operationId === operationId)
          store.dispatch(actions.batchDeleteRequested({ snapshot: state.confirmation }));
      }),
  };
}

export type BatchFacade = ReturnType<typeof createBatchFacade>;
