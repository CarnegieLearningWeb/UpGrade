import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Actions, getEffectsMetadata } from '@ngrx/effects';
import { Action, ScannedActionsSubject, Store, StoreModule } from '@ngrx/store';
import { Subject, Subscription, of, throwError } from 'rxjs';
import {
  DeletionReasonCode,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
  UserRole,
} from 'upgrade_types';
import * as experimentActions from '../experiments/store/experiments.actions';
import * as flagActions from '../feature-flags/store/feature-flags.actions';
import * as segmentActions from '../segments/store/segments.actions';
import { experimentsReducer } from '../experiments/store/experiments.reducer';
import { featureFlagsReducer } from '../feature-flags/store/feature-flags.reducer';
import { segmentsReducer } from '../segments/store/segments.reducer';
import { ExperimentEffects } from '../experiments/store/experiments.effects';
import { FeatureFlagsEffects } from '../feature-flags/store/feature-flags.effects';
import { SegmentsEffects } from '../segments/store/segments.effects';
import { actionLogoutStart, actionSetUserInfo } from '../auth/store/auth.actions';
import { batchResultCounts, selectionItem, selectionView } from './batch-actions.helpers';
import { RootBatchState, newBatchRequestId } from './batch-actions.models';

const fixtures = [
  {
    entity: 'experiments',
    key: 'experiments',
    actions: experimentActions,
    fetchEffect: 'getPaginatedExperiment$',
    fetchMethod: 'getAllExperiment',
    fetch: experimentActions.actionGetExperiments,
  },
  {
    entity: 'flags',
    key: 'featureFlags',
    actions: flagActions,
    fetchEffect: 'fetchFeatureFlags$',
    fetchMethod: 'fetchFeatureFlagsPaginated',
    fetch: flagActions.actionFetchFeatureFlags,
  },
  {
    entity: 'segments',
    key: 'segments',
    actions: segmentActions,
    fetchEffect: 'fetchSegmentsPaginated$',
    fetchMethod: 'fetchSegmentsPaginated',
    fetch: segmentActions.actionFetchSegments,
  },
] as const;

describe.each(fixtures)('$entity batch store/effects integration', (config) => {
  let store: Store;
  let state: any;
  let subscriptions: Subscription;
  let events: Action[];
  let data: any;
  let response: Subject<any>;
  let effects: any;
  let router: any;
  let notifications: any;
  const actions = config.actions.batchActions;
  const rows = ['a', 'b', 'c'].map((name, index) => ({
    id: `11111111-2222-4333-8444-${String(index + 1).padStart(12, '0')}`,
    name,
    state: config.entity === 'experiments' ? EXPERIMENT_STATE.ENROLLING : undefined,
    status: config.entity === 'segments' ? SEGMENT_STATUS.UNUSED : FEATURE_FLAG_STATUS.DISABLED,
    type: SEGMENT_TYPE.PUBLIC,
  }));
  const batch = (): RootBatchState => state[config.key].rootBatch;
  const currentRows = () => state[config.key][config.entity === 'flags' ? 'featureFlags' : config.entity];
  const page = (items = rows) =>
    config.entity === 'segments'
      ? {
          total: items.length,
          nodes: {
            segmentsData: items,
            experimentSegmentInclusionData: [],
            experimentSegmentExclusionData: [],
            featureFlagSegmentInclusionData: [],
            featureFlagSegmentExclusionData: [],
            allParentSegments: [],
          },
        }
      : { total: items.length, nodes: items };
  const eligibility = (ids: string[], absent: string[] = []) => ({
    allDeletable: !absent.length,
    items: ids.map((id) =>
      absent.includes(id)
        ? { id, availability: 'not_found', canDelete: false, reasonCode: DeletionReasonCode.NOT_FOUND }
        : { ...selectionItem(rows.find((row) => row.id === id)), availability: 'present', canDelete: true }
    ),
  });
  const selectRows = (count = rows.length) =>
    rows.slice(0, count).forEach((row) => store.dispatch(actions.toggleRow({ item: selectionItem(row) })));
  const prepare = () => {
    store.dispatch(actions.prepareConfirmation({ operationId: newBatchRequestId() }));
    expect(batch().confirmation).not.toBeNull();
    return batch().confirmation;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        StoreModule.forRoot({
          experiments: experimentsReducer,
          featureFlags: featureFlagsReducer,
          segments: segmentsReducer,
        }),
      ],
    });
    store = TestBed.inject(Store);
    subscriptions = new Subscription();
    subscriptions.add(store.subscribe((value) => (state = value)));
    const events$ = new Actions(TestBed.inject(ScannedActionsSubject));
    events = [];
    subscriptions.add(events$.subscribe((action) => events.push(action)));
    response = new Subject();
    data = {
      checkDeletionEligibility: jest.fn((ids) => of(eligibility(ids))),
      batchDelete: jest.fn(() => response),
      [config.fetchMethod]: jest.fn(() => of(page(rows.filter((row) => !batch().removedIds.includes(row.id))))),
    };
    router = { navigate: jest.fn() };
    notifications = { showSuccess: jest.fn(), showWarning: jest.fn(), showError: jest.fn(), showInfo: jest.fn() };
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', jest.requireActual('../../../assets/i18n/en.json'));
    translate.use('en');
    effects =
      config.entity === 'experiments'
        ? new ExperimentEffects(
            events$,
            store as any,
            data,
            router,
            translate as any,
            notifications,
            {} as any,
            {} as any,
            {} as any
          )
        : config.entity === 'flags'
        ? new FeatureFlagsEffects(
            store as any,
            events$,
            data,
            router,
            notifications,
            translate as any,
            {} as any,
            {} as any
          )
        : new SegmentsEffects(
            store as any,
            events$,
            data,
            {} as any,
            router,
            notifications,
            translate as any,
            {} as any
          );
    // Include every batch effect so reintroducing a focus/refresh effect cannot escape the no-read assertions.
    const batchEffects = Object.keys(getEffectsMetadata(effects)).filter((field) => /batch/i.test(field));
    for (const field of [...batchEffects, config.fetchEffect]) {
      subscriptions.add(effects[field].subscribe((action) => store.dispatch(action)));
    }
    store.dispatch(actionSetUserInfo({ user: { email: 'review@example.com', role: UserRole.ADMIN } }));
    store.dispatch(config.fetch({ fromStarting: true }));
  });
  afterEach(() => {
    subscriptions.unsubscribe();
    TestBed.resetTestingModule();
  });

  it('selects loaded rows, retains hidden selections across replacement reads, and clears all from the header', () => {
    expect(batch().loadedIds).toHaveLength(3); // Also exercises NgRx's queued list-start dispatch.
    selectRows(2);
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[0]])));
    store.dispatch(config.fetch({ fromStarting: true }));
    expect(selectionView(batch(), config.entity)).toMatchObject({
      selectedCount: 2,
      checked: true,
      indeterminate: false,
      notShownCount: 1,
    });
    store.dispatch(actions.toggleHeader({ items: [selectionItem(rows[0])] }));
    expect(Object.keys(batch().selectedById)).toEqual([]);
  });

  it('keeps newly appended rows unselected and deduplicates overlapping responses', () => {
    data[config.fetchMethod].mockReturnValueOnce(of({ ...page(rows.slice(0, 2)), total: 3 }));
    store.dispatch(config.fetch({ fromStarting: true }));
    store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }));
    data[config.fetchMethod].mockReturnValueOnce(of({ ...page(rows.slice(1)), total: 3 }));
    store.dispatch(config.fetch({ fromStarting: false }));
    expect(data[config.fetchMethod]).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 2 }), false);
    expect(batch().loadedIds).toHaveLength(3);
    expect(currentRows()).toHaveLength(3);
    expect(selectionView(batch(), config.entity)).toMatchObject({
      selectedCount: 2,
      checked: false,
      indeterminate: true,
    });
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[0], rows[0]])));
    store.dispatch(config.fetch({ fromStarting: true }));
    expect(currentRows()).toHaveLength(1);
  });

  it('prepares immediately from retained metadata and invalidates the snapshot after deselection', () => {
    selectRows();
    const snapshot = prepare();
    expect(snapshot.items).toHaveLength(3);
    store.dispatch(actions.prepareConfirmation({ operationId: newBatchRequestId() }));
    expect(batch().confirmation).toBe(snapshot);
    store.dispatch(actions.toggleRow({ item: selectionItem(rows[0]) }));
    expect(batch().confirmation).toBeNull();
    expect(batch().selectedById[rows[0].id]).toBeUndefined();
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    expect(data.batchDelete).not.toHaveBeenCalled();
  });

  it('does not fetch eligibility on app/tab focus, opening confirmation, or a related mutation', fakeAsync(() => {
    window.dispatchEvent(new Event('focus'));
    tick(100);
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
    selectRows();
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    store.dispatch(flagActions.actionDeleteFeatureFlagSuccess({ flag: { id: 'other' } as any }));
    tick(100);
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    tick(100);
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
  }));

  it('uses updated page data to block a hidden restriction without an eligibility request', () => {
    selectRows();
    const blocked = {
      ...rows[2],
      state: config.entity === 'experiments' ? EXPERIMENT_STATE.DRAFT : undefined,
      status: config.entity === 'segments' ? SEGMENT_STATUS.USED : FEATURE_FLAG_STATUS.ENABLED,
    };
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[0], rows[1], blocked])));
    store.dispatch(config.fetch({ fromStarting: true }));
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[0]])));
    store.dispatch(config.fetch({ fromStarting: true }));
    store.dispatch(actions.prepareConfirmation({ operationId: newBatchRequestId() }));
    expect(batch().confirmation).toBeNull();
    expect(Object.keys(batch().selectedById)).toHaveLength(3);
    expect(selectionView(batch(), config.entity).canRequestConfirmation).toBe(false);
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
    expect(data.batchDelete).not.toHaveBeenCalled();
  });

  it('retains cached selections until the delete response establishes an absence', () => {
    selectRows();
    const snapshot = prepare();
    expect(snapshot.items).toHaveLength(3);
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: 'rejected',
      results: rows.map(({ id }, index) => ({ id, outcome: index === 1 ? 'not_found' : 'not_attempted' })),
    });
    expect(batch().selectedById[rows[1].id]).toBeUndefined();
    expect(currentRows().some((row) => row.id === rows[1].id)).toBe(false);
    expect(batchResultCounts(batch())).toMatchObject({ deleted: 0, absent: 1 });
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
    expect(data[config.fetchMethod]).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 0 }), true);
    expect(batch().confirmation).toBeNull();
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
  });

  it('freezes the request, rejects duplicate submits, and preserves failures while refreshing the current query', () => {
    selectRows();
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    store.dispatch(actions.batchDeleteRequested({ snapshot: { ...snapshot, operationId: 'duplicate' } }));
    store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }));
    store.dispatch(config.actions.actionSetSearchString({ searchString: 'latest query' }));
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
    expect(data.batchDelete).toHaveBeenCalledWith(rows.map((row) => row.id));
    response.next({
      phase: 'executed',
      results: rows.map((row, index) => ({
        id: row.id,
        outcome: index === 0 ? 'deleted' : index === 1 ? 'failed' : 'not_attempted',
      })),
    });
    expect(batch().selectedById[rows[0].id]).toBeUndefined();
    expect(Object.keys(batch().selectedById)).toEqual([rows[1].id, rows[2].id]);
    const noun = { experiments: 'experiment', flags: 'feature flag', segments: 'segment' }[config.entity];
    expect(notifications.showWarning).toHaveBeenCalledWith(
      `1 ${noun} deleted. 1 item could not be deleted. 1 item was not attempted.`
    );
    expect(data[config.fetchMethod]).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 0, searchParams: expect.objectContaining({ string: 'latest query' }) }),
      true
    );
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('removes two successful deletions and retains only the selection whose state changed', () => {
    selectRows();
    const snapshot = prepare();
    const blocked = {
      ...rows[1],
      state: config.entity === 'experiments' ? EXPERIMENT_STATE.DRAFT : undefined,
      status: config.entity === 'segments' ? SEGMENT_STATUS.USED : FEATURE_FLAG_STATUS.ENABLED,
    };
    data[config.fetchMethod].mockReturnValueOnce(of(page([blocked])));
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: 'executed',
      results: rows.map(({ id }, index) => ({ id, outcome: index === 1 ? 'ineligible' : 'deleted' })),
    });
    expect(Object.keys(batch().selectedById)).toEqual([rows[1].id]);
    expect(currentRows().map((row) => row.id)).toEqual([rows[1].id]);
    expect(selectionView(batch(), config.entity).canRequestConfirmation).toBe(false);
    const noun = { experiments: 'experiments', flags: 'feature flags', segments: 'segments' }[config.entity];
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
    expect(notifications.showWarning).toHaveBeenCalledWith(`2 ${noun} deleted. 1 item could not be deleted.`);
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
  });

  it('keeps the displayed confirmation snapshot when updated rows arrive or focus returns', fakeAsync(() => {
    selectRows(2);
    const snapshot = prepare();
    data[config.fetchMethod].mockReturnValueOnce(of(page([{ ...rows[0], name: 'renamed' }])));
    store.dispatch(config.fetch({ fromStarting: true }));
    window.dispatchEvent(new Event('focus'));
    tick(100);
    expect(batch().confirmation).toBe(snapshot);
    expect(snapshot.items.map(({ name }) => name)).toEqual(['a', 'b']);
    expect(batch().selectedById[rows[0].id].name).toBe('renamed');
    expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    expect(data.batchDelete).toHaveBeenCalledWith([rows[0].id, rows[1].id]);
  }));

  it.each([1, 3])('reports %i deletions once and ignores a list response from before deletion', (count) => {
    selectRows(count);
    const snapshot = prepare();
    const pending = new Subject<any>();
    data[config.fetchMethod].mockReturnValueOnce(pending);
    store.dispatch(config.fetch({ fromStarting: true }));
    const oldRequestId = batch().listRequestId;
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({ phase: 'executed', results: rows.slice(0, count).map(({ id }) => ({ id, outcome: 'deleted' })) });
    pending.next(page());
    const oldSuccess = events.find(
      (action: any) => action.batchListRequestId && action.type.includes('Success')
    ) as any;
    store.dispatch({ ...oldSuccess, batchListRequestId: oldRequestId });
    expect(currentRows().some((row) => row.id === rows[0].id)).toBe(false);
    expect(notifications.showSuccess).toHaveBeenCalledTimes(1);
    const noun = { experiments: 'experiment', flags: 'feature flag', segments: 'segment' }[config.entity];
    expect(notifications.showSuccess).toHaveBeenCalledWith(`${count} ${noun}${count === 1 ? '' : 's'} deleted.`);
  });

  it('reconciles an explicit unknown server result with one bulk read and never retries deletion', () => {
    selectRows();
    const snapshot = prepare();
    const reconcile = new Subject<any>();
    data.checkDeletionEligibility.mockReturnValueOnce(reconcile);
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({ phase: 'executed', results: rows.map(({ id }) => ({ id, outcome: 'unknown' })) });
    expect(batch().operation.status).toBe('reconciling');
    expect(Object.keys(batch().selectedById)).toHaveLength(3);
    reconcile.next(
      eligibility(
        rows.map((row) => row.id),
        [rows[0].id]
      )
    );
    expect(batchResultCounts(batch())).toMatchObject({ deleted: 0, absent: 1, uncertain: true });
    expect(Object.keys(batch().selectedById)).toHaveLength(2);
    expect(notifications.showWarning).toHaveBeenCalledWith(
      '1 item was already absent. Some outcomes could not be confirmed. Check the list before retrying.'
    );
    expect(data.checkDeletionEligibility).toHaveBeenCalledTimes(1);
    expect(data.checkDeletionEligibility).toHaveBeenCalledWith(rows.map((row) => row.id));
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
  });

  it.each([0, 400, 403, 500, 504])(
    'releases selection after HTTP %i without another request or result snackbar',
    (status) => {
      selectRows();
      const snapshot = prepare();
      const fetchCount = data[config.fetchMethod].mock.calls.length;
      const beforeRows = currentRows();
      const loadedIds = [...batch().loadedIds];
      store.dispatch(actions.batchDeleteRequested({ snapshot }));
      response.error({ status });
      expect(batch().operation.status).toBe('complete');
      expect(currentRows()).toEqual(beforeRows);
      expect(batch().loadedIds).toEqual(loadedIds);
      expect(data.checkDeletionEligibility).not.toHaveBeenCalled();
      expect(data[config.fetchMethod]).toHaveBeenCalledTimes(fetchCount);
      expect(notifications.showWarning).not.toHaveBeenCalled();
      expect(notifications.showSuccess).not.toHaveBeenCalled();
      expect(Object.keys(batch().selectedById)).toHaveLength(3);
      expect(data.batchDelete).toHaveBeenCalledTimes(1);
      store.dispatch(actions.toggleRow({ item: selectionItem(rows[0]) }));
      expect(batch().selectedById[rows[0].id]).toBeUndefined();
      store.dispatch(actions.toggleRow({ item: selectionItem(rows[0]) }));
      expect(batch().selectedById[rows[0].id]).toBeDefined();
      store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }));
      expect(Object.keys(batch().selectedById)).toHaveLength(0);
      store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }));
      expect(Object.keys(batch().selectedById)).toHaveLength(3);
    }
  );

  it('reports a preflight rejection without removing any selected or hidden row', () => {
    selectRows();
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: 'rejected',
      results: rows.map(({ id }, index) => ({ id, outcome: index === 2 ? 'ineligible' : 'not_attempted' })),
    });
    expect(currentRows()).toHaveLength(3);
    expect(Object.keys(batch().selectedById)).toHaveLength(3);
    expect(batch().operation.result.phase).toBe('rejected');
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
  });

  it('keeps confirmed deletion when the post-commit cleanup or list refresh fails', () => {
    selectRows(1);
    const snapshot = prepare();
    data[config.fetchMethod].mockReturnValue(throwError(() => new Error('refresh unavailable')));
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: 'executed',
      results: [{ id: rows[0].id, outcome: 'deleted', reasonCode: 'post_delete_failed' }],
    });
    const noun = { experiments: 'experiment', flags: 'feature flag', segments: 'segment' }[config.entity];
    expect(notifications.showWarning).toHaveBeenCalledWith(
      `1 ${noun} deleted. Related updates could not be completed.`
    );
    expect(batch().selectedById[rows[0].id]).toBeUndefined();
    expect(batch().operation.result.results[0].outcome).toBe('deleted');
    expect(batch().listLoading).toBe(false);
    expect(batch().loadedIds).toEqual([rows[1].id, rows[2].id]);
    store.dispatch(actions.toggleRow({ item: selectionItem(rows[1]) }));
    expect(batch().selectedById[rows[1].id]).toBeDefined();
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
  });

  it('retains unknown items after a malformed response without retrying deletion', () => {
    selectRows();
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({ phase: 'executed', results: [] });
    expect(batch().operation.result.results.every((result) => result.outcome === 'unknown')).toBe(true);
    expect(Object.keys(batch().selectedById)).toHaveLength(3);
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
  });

  it('requires a new confirmation and sends only retained IDs on an explicit retry', () => {
    selectRows();
    const first = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot: first }));
    response.next({
      phase: 'executed',
      results: rows.map(({ id }, index) => ({ id, outcome: index === 0 ? 'deleted' : 'not_attempted' })),
    });
    response.complete();
    store.dispatch(actions.batchDeleteRequested({ snapshot: first }));
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
    const second = prepare();
    expect(second.operationId).not.toBe(first.operationId);
    data.batchDelete.mockReturnValue(new Subject());
    store.dispatch(actions.batchDeleteRequested({ snapshot: second }));
    expect(data.batchDelete).toHaveBeenLastCalledWith([rows[1].id, rows[2].id]);
  });

  it('clears state on logout and ignores a late deletion response in the next session', () => {
    selectRows();
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    store.dispatch(actionLogoutStart());
    store.dispatch(actionSetUserInfo({ user: { email: 'next@example.com', role: UserRole.ADMIN } }));
    response.next({ phase: 'executed', results: rows.map(({ id }) => ({ id, outcome: 'deleted' })) });
    expect(batch().operation).toBeNull();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
    expect(batch().removedIds).toHaveLength(0);
    expect(notifications.showSuccess).not.toHaveBeenCalled();
  });

  it('retains selection but invalidates confirmation when the role changes', () => {
    selectRows();
    prepare();
    store.dispatch(actionSetUserInfo({ user: { email: 'review@example.com', role: UserRole.READER } }));
    expect(Object.keys(batch().selectedById)).toHaveLength(3);
    expect(batch().confirmation).toBeNull();
    expect(selectionView(batch(), config.entity).reasonCode).toBe(DeletionReasonCode.MISSING_PERMISSION);
  });
});
