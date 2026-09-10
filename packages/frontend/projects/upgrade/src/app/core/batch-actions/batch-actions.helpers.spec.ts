import {
  BatchDeleteEntity,
  DeletionReasonCode,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
  UserRole,
} from 'upgrade_types';
import { createBatchActions } from './batch-actions.actions';
import {
  localDeletionReason,
  selectionView,
  validateBatchResponse,
  validateEligibilityResponse,
} from './batch-actions.helpers';
import { RootBatchState, RootSelectionItem, initialRootBatchState } from './batch-actions.models';
import { reduceRootBatch } from './batch-actions.reducer';

describe('Root selection rules', () => {
  const actions = createBatchActions('Test');
  const item = (id: string): RootSelectionItem => ({
    id,
    name: id,
    stateOrStatus: SEGMENT_STATUS.UNUSED,
    segmentType: SEGMENT_TYPE.PUBLIC,
  });
  const state = (selected: string[], loaded: string[]): RootBatchState => ({
    ...initialRootBatchState,
    role: UserRole.ADMIN,
    selectedById: Object.fromEntries(selected.map((id) => [id, item(id)])),
    loadedIds: loaded,
  });

  it.each([
    [[], [], false, false, 0],
    [['a'], ['a', 'b'], false, true, 0],
    [['a', 'b'], ['a', 'b'], true, false, 0],
    [['a', 'b', 'hidden'], ['a', 'b'], true, false, 1],
    [['a', 'hidden'], [], false, true, 2],
  ])(
    'derives the header from selected=%j and loaded=%j',
    (selected: string[], loaded: string[], checked: boolean, indeterminate: boolean, notShownCount: number) => {
      expect(selectionView(state(selected, loaded), 'segments')).toMatchObject({
        checked,
        indeterminate,
        notShownCount,
      });
    }
  );

  it('excludes global/private segments and detail-only IDs from header selection', () => {
    const current = state([], ['public', 'private', 'global']);
    const next = reduceRootBatch(
      current,
      actions.toggleHeader({
        items: [
          item('public'),
          { ...item('private'), segmentType: SEGMENT_TYPE.PRIVATE },
          { ...item('global'), segmentType: SEGMENT_TYPE.GLOBAL_EXCLUDE },
          item('detail-only'),
        ],
      }),
      actions,
      'segments'
    );
    expect(Object.keys(next.selectedById)).toEqual(['public']);
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
    EXPERIMENT_STATE.INACTIVE,
    EXPERIMENT_STATE.ENROLLING,
    EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
    EXPERIMENT_STATE.CANCELLED,
    EXPERIMENT_STATE.ARCHIVED,
  ])('allows the existing experiment menu state %s', (status) => {
    expect(localDeletionReason('experiments', { id: 'a', stateOrStatus: status }, UserRole.CREATOR)).toBeUndefined();
  });

  it.each([
    [
      'experiments',
      { id: 'a', stateOrStatus: EXPERIMENT_STATE.DRAFT },
      UserRole.ADMIN,
      DeletionReasonCode.EXPERIMENT_STATE_UNSUPPORTED,
    ],
    [
      'flags',
      { id: 'a', stateOrStatus: FEATURE_FLAG_STATUS.ENABLED },
      UserRole.ADMIN,
      DeletionReasonCode.FEATURE_FLAG_ENABLED,
    ],
    ['flags', { id: 'a' }, UserRole.ADMIN, DeletionReasonCode.FEATURE_FLAG_STATUS_UNSUPPORTED],
    [
      'segments',
      { ...item('a'), stateOrStatus: SEGMENT_STATUS.USED },
      UserRole.ADMIN,
      DeletionReasonCode.SEGMENT_IN_USE,
    ],
    ['segments', item('a'), UserRole.READER, DeletionReasonCode.MISSING_PERMISSION],
    ['segments', item('a'), UserRole.USER_MANAGER, undefined],
    [
      'flags',
      { id: 'a', stateOrStatus: FEATURE_FLAG_STATUS.DISABLED },
      UserRole.USER_MANAGER,
      DeletionReasonCode.MISSING_PERMISSION,
    ],
  ])(
    'applies entity-specific permissions and status rules for %s',
    (entity: BatchDeleteEntity, selected: RootSelectionItem, role: UserRole, reason: DeletionReasonCode) => {
      expect(localDeletionReason(entity, selected, role)).toBe(reason);
    }
  );

  it('treats an incomplete or duplicate eligibility/deletion response as uncertain rather than silently removing rows', () => {
    expect(() => validateEligibilityResponse({ items: [], allDeletable: true }, ['a'])).toThrow();
    expect(() =>
      validateBatchResponse({ phase: 'executed', results: [{ id: 'a', outcome: 'deleted' }] }, ['a', 'b'])
    ).toThrow();
    expect(() =>
      validateBatchResponse(
        {
          phase: 'executed',
          results: [
            { id: 'a', outcome: 'deleted' },
            { id: 'a', outcome: 'deleted' },
          ],
        },
        ['a', 'b']
      )
    ).toThrow();
  });
});
