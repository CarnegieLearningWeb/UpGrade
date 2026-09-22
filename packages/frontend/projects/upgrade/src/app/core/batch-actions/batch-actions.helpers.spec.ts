import {
  BatchDeleteEntity,
  BatchDeleteResult,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_STATUS,
} from 'upgrade_types';
import { createBatchActions } from './batch-actions.actions';
import { localDeletionReason, selectionView, validateBatchResponse } from './batch-actions.helpers';
import {
  BatchSelectionReasonCode,
  RootBatchState,
  RootSelectionItem,
  initialRootBatchState,
} from './batch-actions.models';
import { reduceRootBatch } from './batch-actions.reducer';

describe('Root selection rules', () => {
  const actions = createBatchActions('Test');
  const item = (id: string): RootSelectionItem => ({
    id,
    name: id,
    stateOrStatus: SEGMENT_STATUS.UNUSED,
  });
  const state = (selected: string[], loaded: string[]): RootBatchState => ({
    ...initialRootBatchState,
    selectedById: Object.fromEntries(selected.map((id) => [id, item(id)])),
    loadedIds: loaded,
  });

  it.each([
    [[], [], false, false],
    [['a'], ['a', 'b'], false, true],
    [['a', 'b'], ['a', 'b'], true, false],
    [['a', 'b', 'hidden'], ['a', 'b'], true, false],
    [['a', 'hidden'], [], false, true],
  ])(
    'derives the header from selected=%j and loaded=%j',
    (selected: string[], loaded: string[], checked: boolean, indeterminate: boolean) => {
      expect(selectionView(state(selected, loaded), 'segments')).toMatchObject({
        checked,
        indeterminate,
      });
    }
  );

  it('excludes IDs outside the loaded root rows from header selection', () => {
    const current = state([], ['loaded']);
    const next = reduceRootBatch(
      current,
      actions.toggleHeader({
        items: [item('loaded'), item('detail-only')],
      }),
      actions,
      'segments'
    );
    expect(Object.keys(next.selectedById)).toEqual(['loaded']);
    expect(current.selectedById).toEqual({});
  });

  it('can clear hidden selections during replacement loading but cannot select an obsolete page', () => {
    const current = { ...state(['hidden'], []), listLoading: true };
    const cleared = reduceRootBatch(current, actions.toggleHeader({ items: [item('old')] }), actions, 'segments');
    expect(cleared.selectedById).toEqual({});
    expect(
      reduceRootBatch(cleared, actions.toggleHeader({ items: [item('old')] }), actions, 'segments').selectedById
    ).toEqual({});
  });

  it.each([
    [EXPERIMENT_STATE.DRAFT, true],
    [EXPERIMENT_STATE.INACTIVE, true],
    [EXPERIMENT_STATE.COMPLETED, true],
    [EXPERIMENT_STATE.CANCELLED, true],
    [EXPERIMENT_STATE.ARCHIVED, true],
    [EXPERIMENT_STATE.PREVIEW, false],
    [EXPERIMENT_STATE.SCHEDULED, false],
    [EXPERIMENT_STATE.RUNNING, false],
    [EXPERIMENT_STATE.ENROLLING, false],
    [EXPERIMENT_STATE.PAUSED, false],
    [EXPERIMENT_STATE.ENROLLMENT_COMPLETE, false],
  ])('applies the experiment deletion policy to %s', (status: EXPERIMENT_STATE, allowed: boolean) => {
    expect(localDeletionReason('experiments', { id: 'a', stateOrStatus: status })).toBe(
      allowed ? undefined : BatchSelectionReasonCode.EXPERIMENT_ACTIVE
    );
  });

  it.each<[BatchDeleteEntity, RootSelectionItem, BatchSelectionReasonCode]>([
    ['flags', { id: 'a', stateOrStatus: FEATURE_FLAG_STATUS.ENABLED }, BatchSelectionReasonCode.FEATURE_FLAG_ENABLED],
    ['segments', { ...item('a'), stateOrStatus: SEGMENT_STATUS.USED }, BatchSelectionReasonCode.SEGMENT_USED],
  ])('applies entity-specific status rules for %s', (entity, selected, reason) => {
    expect(localDeletionReason(entity, selected)).toBe(reason);
  });

  it('accepts reordered results but rejects incomplete, duplicate, or unexpected result IDs', () => {
    const complete: BatchDeleteResult = {
      results: [
        { id: 'b', outcome: 'not_found' },
        { id: 'a', outcome: 'deleted' },
      ],
    };
    expect(validateBatchResponse(complete, ['a', 'b'])).toBe(complete);
    expect(() => validateBatchResponse({ results: [{ id: 'a', outcome: 'deleted' }] }, ['a', 'b'])).toThrow();
    for (const returnedIds of [
      ['a', 'a'],
      ['a', 'unexpected'],
    ]) {
      expect(() =>
        validateBatchResponse({ results: returnedIds.map((id) => ({ id, outcome: 'deleted' })) }, ['a', 'b'])
      ).toThrow();
    }
  });
});
