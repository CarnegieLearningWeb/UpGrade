import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Actions, getEffectsMetadata } from '@ngrx/effects';
import { Action, ScannedActionsSubject, Store, StoreModule } from '@ngrx/store';
import { Subject, Subscription, of, throwError } from 'rxjs';
import {
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  FLAG_SEARCH_KEY,
  SEGMENT_STATUS,
  SORT_AS_DIRECTION,
  UserRole,
} from 'upgrade_types';
import * as experimentActions from '../experiments/store/experiments.actions';
import * as flagActions from '../feature-flags/store/feature-flags.actions';
import * as segmentActions from '../segments/store/segments.actions';
import { experimentsReducer } from '../experiments/store/experiments.reducer';
import { featureFlagsReducer } from '../feature-flags/store/feature-flags.reducer';
import { segmentsReducer } from '../segments/store/segments.reducer';
import { selectSelectedExperiment } from '../experiments/store/experiments.selectors';
import { selectSelectedSegment } from '../segments/store/segments.selectors';
import { ExperimentEffects } from '../experiments/store/experiments.effects';
import { FeatureFlagsEffects } from '../feature-flags/store/feature-flags.effects';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { FeatureFlagRootSectionCardComponent } from '../../features/dashboard/feature-flags/pages/feature-flag-root-page/feature-flag-root-page-content/feature-flag-root-section-card/feature-flag-root-section-card.component';
import { SegmentsEffects } from '../segments/store/segments.effects';
import { actionLogoutStart, actionSetUserInfo } from '../auth/store/auth.actions';
import { batchResultCounts, selectionItem, selectionView } from './batch-actions.helpers';
import { RootBatchState, newBatchRequestId } from './batch-actions.models';

const fixtures = [
  {
    entity: 'experiments',
    rootPath: '/home',
    key: 'experiments',
    loadingKey: 'isLoadingExperiment',
    actions: experimentActions,
    fetchEffect: 'getPaginatedExperiment$',
    fetchMethod: 'getAllExperiment',
    fetch: experimentActions.actionGetExperiments,
  },
  {
    entity: 'flags',
    rootPath: '/featureflags',
    key: 'featureFlags',
    loadingKey: 'isLoadingFeatureFlags',
    actions: flagActions,
    fetchEffect: 'fetchFeatureFlags$',
    fetchMethod: 'fetchFeatureFlagsPaginated',
    fetch: flagActions.actionFetchFeatureFlags,
  },
  {
    entity: 'segments',
    rootPath: '/segments',
    key: 'segments',
    loadingKey: 'isLoadingSegments',
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
    state: config.entity === 'experiments' ? EXPERIMENT_STATE.INACTIVE : undefined,
    status: config.entity === 'segments' ? SEGMENT_STATUS.UNUSED : FEATURE_FLAG_STATUS.DISABLED,
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
      batchDelete: jest.fn(() => response),
      [config.fetchMethod]: jest.fn(() => of(page(rows.filter((row) => !batch().removedIds.includes(row.id))))),
    };
    router = { url: config.rootPath, navigate: jest.fn() };
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
    // Include every batch effect to exercise submission and completion together.
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

  if (config.entity === 'flags') {
    it('clears the search through the root handler without cancelling the unfiltered request', () => {
      subscriptions.add(effects.fetchFeatureFlagsOnSearchString$.subscribe());
      subscriptions.add(effects.fetchFlagsOnSearchKeyChange$.subscribe());
      const featureFlagService = new FeatureFlagsService(store as any, { setItem: jest.fn() } as any);
      const search = (searchString: string) =>
        FeatureFlagRootSectionCardComponent.prototype.onSearch.call({ featureFlagService } as any, {
          searchKey: FLAG_SEARCH_KEY.NAME,
          searchString,
        });
      data[config.fetchMethod].mockReturnValue(of(page([rows[0]])));
      search('a');
      const unfiltered = new Subject<any>();
      data[config.fetchMethod].mockReturnValue(unfiltered);
      search('');
      expect(state.featureFlags.searchValue).toBe('');
      expect(data[config.fetchMethod].mock.calls.at(-1)[0].searchParams).toBeUndefined();
      unfiltered.next(page());
      unfiltered.complete();
      expect(currentRows().map(({ id }) => id)).toEqual(rows.map(({ id }) => id));
      expect(batch().loadedIds).toHaveLength(3);
      expect(batch().listLoading).toBe(false);
      expect(state.featureFlags.isLoadingFeatureFlags).toBe(false);
    });
  }

  it('selects loaded rows, retains hidden selections across replacement reads, and clears all from the header', () => {
    expect(batch().loadedIds).toHaveLength(3); // Also exercises NgRx's queued list-start dispatch.
    selectRows(2);
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[0]])));
    store.dispatch(config.fetch({ fromStarting: true }));
    expect(selectionView(batch(), config.entity)).toMatchObject({
      selectedCount: 2,
      checked: true,
      indeterminate: false,
    });
    store.dispatch(actions.toggleHeader({ items: [selectionItem(rows[0])] }));
    expect(Object.keys(batch().selectedById)).toEqual([]);
    store.dispatch(config.actions.actionSetSearchString({ searchString: 'replacement query' }));
    expect(selectionView(batch(), config.entity).canToggleHeader).toBe(false);
    store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }));
    expect(Object.keys(batch().selectedById)).toEqual([]);
  });

  it.each(['search', 'sort'])('restores selection controls after a failed replacement %s', (change) => {
    selectRows(1);
    const beforeRows = currentRows();
    const pendingList = new Subject<any>();
    data[config.fetchMethod].mockReturnValueOnce(pendingList);
    store.dispatch(
      change === 'search'
        ? config.actions.actionSetSearchString({ searchString: 'b' })
        : config.actions.actionSetSortingType({ sortingType: SORT_AS_DIRECTION.DESCENDING })
    );
    store.dispatch(config.fetch({ fromStarting: true }));
    expect(batch().loadedIds).toEqual([]);
    store.dispatch(actions.listFailed({ requestId: 'obsolete-request' }));
    expect(batch().loadedIds).toEqual([]);
    expect(batch().listLoading).toBe(true);

    pendingList.error({ status: 0 });
    expect(currentRows()).toEqual(beforeRows);
    expect(batch().listLoading).toBe(false);
    expect(state[config.key][config.loadingKey]).toBe(false);
    expect(batch().loadedIds).toEqual(rows.map(({ id }) => id));
    expect(Object.keys(batch().selectedById)).toEqual([rows[0].id]);

    store.dispatch(actions.toggleRow({ item: selectionItem(rows[1]) }));
    expect(Object.keys(batch().selectedById)).toEqual([rows[0].id, rows[1].id]);
    store.dispatch(actions.toggleRow({ item: selectionItem(rows[0]) }));
    expect(Object.keys(batch().selectedById)).toEqual([rows[1].id]);
    store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }));
    expect(selectionView(batch(), config.entity).canToggleHeader).toBe(true);
    store.dispatch(actions.toggleHeader({ items: rows.map(selectionItem) }));
    expect(Object.keys(batch().selectedById)).toEqual(rows.map(({ id }) => id));
    expect(data[config.fetchMethod]).toHaveBeenCalledTimes(2);
    expect(notifications.showWarning).not.toHaveBeenCalled();
  });

  it('selects loaded rows during incremental loading and leaves newly appended rows unselected', () => {
    data[config.fetchMethod].mockReturnValueOnce(of({ ...page(rows.slice(0, 2)), total: 3 }));
    store.dispatch(config.fetch({ fromStarting: true }));
    const nextPage = new Subject<any>();
    data[config.fetchMethod].mockReturnValueOnce(nextPage);
    store.dispatch(config.fetch({ fromStarting: false }));
    expect(data[config.fetchMethod]).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 2 }), false);
    expect(batch().listLoading).toBe(true);
    expect(selectionView(batch(), config.entity).canToggleHeader).toBe(true);
    store.dispatch(actions.toggleHeader({ items: currentRows().map(selectionItem) }));
    expect(Object.keys(batch().selectedById)).toEqual(rows.slice(0, 2).map(({ id }) => id));
    nextPage.next({ ...page(rows.slice(1)), total: 3 });
    nextPage.complete();
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

    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    expect(data.batchDelete).not.toHaveBeenCalled();
  });

  it('keeps selection-time availability when refreshed rows change state, including hidden selections', () => {
    selectRows();
    const blocked = {
      ...rows[2],
      state: config.entity === 'experiments' ? EXPERIMENT_STATE.RUNNING : undefined,
      status: config.entity === 'segments' ? SEGMENT_STATUS.USED : FEATURE_FLAG_STATUS.ENABLED,
    };
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[0], rows[1], blocked])));
    store.dispatch(config.fetch({ fromStarting: true }));
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[0]])));
    store.dispatch(config.fetch({ fromStarting: true }));
    const snapshot = prepare();
    expect(Object.keys(batch().selectedById)).toHaveLength(3);
    expect(batch().selectedById[blocked.id]).toEqual(selectionItem(rows[2]));
    expect(selectionView(batch(), config.entity).canRequestConfirmation).toBe(true);

    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    expect(data.batchDelete).toHaveBeenCalledWith(rows.map(({ id }) => id));
  });

  it('removes an absent item and retains failed and unattempted selections with a warning', () => {
    selectRows();
    const snapshot = prepare();
    expect(snapshot.items).toHaveLength(3);

    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: 'executed',
      results: [
        { id: rows[0].id, outcome: 'not_found', reasonCode: 'not_found' },
        { id: rows[1].id, outcome: 'failed', reasonCode: 'delete_failed' },
        { id: rows[2].id, outcome: 'not_attempted' },
      ],
    });
    expect(Object.keys(batch().selectedById)).toEqual([rows[1].id, rows[2].id]);
    expect(currentRows().map(({ id }) => id)).toEqual([rows[1].id, rows[2].id]);
    expect(batchResultCounts(batch())).toMatchObject({ deleted: 0, absent: 1, failed: 1, notAttempted: 1 });
    expect(notifications.showWarning).toHaveBeenCalledWith(
      '1 item was already absent. 1 item could not be deleted. 1 item was not attempted.'
    );
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(notifications.showError).not.toHaveBeenCalled();
    expect(data[config.fetchMethod]).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 0 }), true);
    expect(batch().confirmation).toBeNull();
  });

  it.each([0, 1])('reports success when %i of two items are deleted and the rest were already absent', (deleted) => {
    selectRows(2);
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: deleted ? 'executed' : 'rejected',
      results: rows
        .slice(0, 2)
        .map(({ id }, index) =>
          index < deleted ? { id, outcome: 'deleted' } : { id, outcome: 'not_found', reasonCode: 'not_found' }
        ),
    });
    const noun = { experiments: 'experiment', flags: 'feature flag', segments: 'segment' }[config.entity];
    expect(notifications.showSuccess).toHaveBeenCalledWith(
      deleted ? `1 ${noun} deleted. 1 item was already absent.` : '2 items were already absent.'
    );
    expect(notifications.showSuccess).toHaveBeenCalledTimes(1);
    expect(notifications.showWarning).not.toHaveBeenCalled();
    expect(notifications.showError).not.toHaveBeenCalled();
    expect(Object.keys(batch().selectedById)).toEqual([]);
    expect(currentRows().map(({ id }) => id)).toEqual([rows[2].id]);
  });

  it('reports an error and retains selections when the first deletion fails', () => {
    selectRows();
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: 'executed',
      results: rows.map(({ id }, index) => ({ id, outcome: index === 0 ? 'failed' : 'not_attempted' })),
    });
    expect(notifications.showError).toHaveBeenCalledWith('1 item could not be deleted. 2 items were not attempted.');
    expect(notifications.showError).toHaveBeenCalledTimes(1);
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(notifications.showWarning).not.toHaveBeenCalled();
    expect(Object.keys(batch().selectedById)).toEqual(rows.map(({ id }) => id));
    expect(currentRows()).toEqual(rows);
    expect(selectionView(batch(), config.entity).busy).toBe(false);
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
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(notifications.showError).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it.each(['search', 'sort'])(
    'applies a user-requested %s while deletion is pending even if deletion fails',
    (change) => {
      selectRows();
      const snapshot = prepare();
      store.dispatch(actions.batchDeleteRequested({ snapshot }));
      const pendingList = new Subject<any>();
      data[config.fetchMethod].mockReturnValueOnce(pendingList);
      if (change === 'search') {
        store.dispatch(config.actions.actionSetSearchString({ searchString: 'b' }));
      } else {
        store.dispatch(config.actions.actionSetSortingType({ sortingType: SORT_AS_DIRECTION.DESCENDING }));
      }
      store.dispatch(config.fetch({ fromStarting: true }));
      expect(data[config.fetchMethod]).toHaveBeenCalledTimes(2);
      expect(data[config.fetchMethod]).toHaveBeenLastCalledWith(
        expect.objectContaining(
          change === 'search'
            ? { searchParams: expect.objectContaining({ string: 'b' }) }
            : { sortParams: expect.objectContaining({ sortAs: SORT_AS_DIRECTION.DESCENDING }) }
        ),
        false
      );
      response.error({ status: 0 });
      expect(state[config.key][config.loadingKey]).toBe(true);
      const resultRows = change === 'search' ? [rows[1]] : [...rows].reverse();
      pendingList.next(page(resultRows));
      pendingList.complete();
      expect(currentRows().map(({ id }) => id)).toEqual(resultRows.map(({ id }) => id));
      expect(batch().loadedIds).toEqual(resultRows.map(({ id }) => id));
      expect(batch().listLoading).toBe(false);
      expect(state[config.key][config.loadingKey]).toBe(false);
      expect(Object.keys(batch().selectedById)).toHaveLength(3);
      expect(data[config.fetchMethod]).toHaveBeenCalledTimes(2);

      expect(notifications.showWarning).not.toHaveBeenCalled();
      expect(notifications.showSuccess).not.toHaveBeenCalled();
    }
  );

  it('keeps the displayed confirmation snapshot when updated rows arrive', () => {
    selectRows(2);
    const snapshot = prepare();
    data[config.fetchMethod].mockReturnValueOnce(
      of(
        page([
          {
            ...rows[0],
            name: 'renamed',
            state: config.entity === 'experiments' ? EXPERIMENT_STATE.RUNNING : undefined,
            status: config.entity === 'segments' ? SEGMENT_STATUS.USED : FEATURE_FLAG_STATUS.ENABLED,
          },
        ])
      )
    );
    store.dispatch(config.fetch({ fromStarting: true }));
    expect(batch().confirmation).toBe(snapshot);
    expect(snapshot.items.map(({ name }) => name)).toEqual(['a', 'b']);
    expect(batch().selectedById[rows[0].id]).toEqual(selectionItem(rows[0]));

    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    expect(data.batchDelete).toHaveBeenCalledWith([rows[0].id, rows[1].id]);
  });

  it.each([1, 3])('reports %i deletions once and ignores stale reads started before or during deletion', (count) => {
    const options = rows.map(({ id, name }) => ({ id, name, context: 'home' }));
    store.dispatch(experimentActions.actionFetchAllExperimentNamesSuccess({ allExperimentNames: options }));
    store.dispatch(segmentActions.actionFetchListSegmentOptionsSuccess({ listSegmentOptions: options }));
    selectRows(count);
    const snapshot = prepare();
    const pending = new Subject<any>();
    data[config.fetchMethod].mockReturnValueOnce(pending);
    store.dispatch(config.fetch({ fromStarting: true }));
    const oldRequestId = batch().listRequestId;
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    const duringDeletion = new Subject<any>();
    data[config.fetchMethod].mockReturnValueOnce(duringDeletion);
    store.dispatch(config.fetch({ fromStarting: true }));
    response.next({ phase: 'executed', results: rows.slice(0, count).map(({ id }) => ({ id, outcome: 'deleted' })) });
    pending.next(page());
    duringDeletion.next(page());
    const oldSuccess = events.find(
      (action: any) => action.batchListRequestId && action.type.includes('Success')
    ) as any;
    store.dispatch({ ...oldSuccess, batchListRequestId: oldRequestId });
    expect(currentRows().some((row) => row.id === rows[0].id)).toBe(false);
    expect(state.experiments.allExperimentNames).toEqual(
      config.entity === 'experiments' ? options.slice(count) : options
    );
    expect(state.segments.listSegmentOptions).toEqual(config.entity === 'segments' ? options.slice(count) : options);
    const eventTypes = events.map((action) => action.type);
    expect(eventTypes).not.toContain(experimentActions.actionFetchAllExperimentNames.type);
    expect(eventTypes).not.toContain(segmentActions.actionFetchListSegmentOptions.type);
    expect(notifications.showSuccess).toHaveBeenCalledTimes(1);
    const noun = { experiments: 'experiment', flags: 'feature flag', segments: 'segment' }[config.entity];
    expect(notifications.showSuccess).toHaveBeenCalledWith(`${count} ${noun}${count === 1 ? '' : 's'} deleted.`);
  });

  it.each([0, 500])(
    'restores cancelled replacement rows after HTTP %i without another request or snackbar',
    (status) => {
      selectRows();
      const pendingList = new Subject<any>();
      data[config.fetchMethod].mockReturnValueOnce(pendingList);
      store.dispatch(config.actions.actionSetSearchString({ searchString: 'b' }));
      store.dispatch(config.fetch({ fromStarting: true }));
      expect(state[config.key][config.loadingKey]).toBe(true);
      expect(batch().loadedIds).toEqual([]);
      const fetchCount = data[config.fetchMethod].mock.calls.length;
      const beforeRows = currentRows();
      const snapshot = prepare();
      store.dispatch(actions.batchDeleteRequested({ snapshot }));
      expect(pendingList.observed).toBe(false);
      response.error({ status });
      pendingList.next(page([]));
      pendingList.complete();
      expect(batch().operation.status).toBe('complete');
      expect(batch().listLoading).toBe(false);
      expect(state[config.key][config.loadingKey]).toBe(false);
      expect(currentRows()).toEqual(beforeRows);
      expect(batch().loadedIds).toEqual(beforeRows.map(({ id }) => id));

      expect(data[config.fetchMethod]).toHaveBeenCalledTimes(fetchCount);
      expect(notifications.showWarning).not.toHaveBeenCalled();
      expect(notifications.showSuccess).not.toHaveBeenCalled();
      expect(notifications.showError).not.toHaveBeenCalled();
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

  if (config.entity !== 'flags') {
    it.each(['deletion', 'refresh'])('preserves open details when leaving during %s', (pending) => {
      selectRows(1);
      const snapshot = prepare();
      store.dispatch(actions.batchDeleteRequested({ snapshot }));
      const pendingRefresh = new Subject<any>();
      data[config.fetchMethod].mockReturnValue(pendingRefresh);
      const result = { phase: 'executed', results: [{ id: rows[0].id, outcome: 'deleted' }] };
      if (pending === 'refresh') {
        response.next(result);
        expect(pendingRefresh.observed).toBe(true);
      }

      const viewed = { ...rows[2], description: 'Loaded detail' };
      router.url = `${config.rootPath}/detail/${viewed.id}`;
      store.dispatch(actions.rootPageLeft());
      if (config.entity === 'experiments') {
        store.dispatch(experimentActions.actionGetExperimentByIdSuccess({ experiment: viewed as any }));
      } else {
        store.dispatch(
          segmentActions.actionGetSegmentByIdSuccess({
            segment: viewed as any,
            experimentSegmentInclusion: [],
            experimentSegmentExclusion: [],
            featureFlagSegmentInclusion: [],
            featureFlagSegmentExclusion: [],
            allParentSegments: [],
          })
        );
      }
      const selectedDetail = () =>
        config.entity === 'experiments'
          ? selectSelectedExperiment.projector(
              { state: { params: { experimentId: viewed.id } } } as any,
              state.experiments
            )
          : selectSelectedSegment.projector(
              { state: { params: { segmentId: viewed.id } } } as any,
              state.segments.segments
            );
      expect(selectedDetail()?.id).toBe(viewed.id);
      if (pending === 'deletion') response.next(result);
      pendingRefresh.next(page([rows[1]]));
      pendingRefresh.complete();
      expect(selectedDetail()?.id).toBe(viewed.id);
      expect(batch().operation.status).toBe('complete');
      expect(batch().removedIds).toContain(rows[0].id);
      expect(batch().listLoading).toBe(false);
      expect(state[config.key][config.loadingKey]).toBe(false);
      expect(Object.keys(batch().selectedById)).toEqual([]);
      expect(data[config.fetchMethod]).toHaveBeenCalledTimes(pending === 'refresh' ? 2 : 1);
      expect(notifications.showSuccess).toHaveBeenCalledTimes(1);
      expect(router.navigate).not.toHaveBeenCalled();

      router.url = `${config.rootPath}?view=all#table`;
      data[config.fetchMethod].mockReturnValue(of(page([rows[1], viewed])));
      store.dispatch(config.fetch({ fromStarting: true }));
      expect(currentRows().map(({ id }) => id)).toEqual([rows[1].id, viewed.id]);
      expect(batch().loadedIds).toEqual([rows[1].id, viewed.id]);
    });
  }

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
    expect(notifications.showWarning).toHaveBeenCalledWith(`1 ${noun} deleted. An error occurred after deletion.`);
    expect(batch().selectedById[rows[0].id]).toBeUndefined();
    expect(batch().operation.result.results[0].outcome).toBe('deleted');
    expect(batch().listLoading).toBe(false);
    expect(batch().loadedIds).toEqual([rows[1].id, rows[2].id]);
    store.dispatch(actions.toggleRow({ item: selectionItem(rows[1]) }));
    expect(batch().selectedById[rows[1].id]).toBeDefined();
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(notifications.showError).not.toHaveBeenCalled();
  });

  it('retains an unknown item after refreshing the list and reports the confirmed results once', () => {
    selectRows();
    const snapshot = prepare();
    const fetchCount = data[config.fetchMethod].mock.calls.length;
    data[config.fetchMethod].mockReturnValueOnce(of(page([rows[2]])));
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({
      phase: 'executed',
      results: [
        { id: rows[0].id, outcome: 'deleted' },
        { id: rows[1].id, outcome: 'unknown' },
        { id: rows[2].id, outcome: 'not_attempted' },
      ],
    });
    expect(batch().operation.status).toBe('complete');
    expect(Object.keys(batch().selectedById)).toEqual([rows[1].id, rows[2].id]);
    expect(batchResultCounts(batch())).toMatchObject({ deleted: 1, absent: 0, uncertain: true, notAttempted: 1 });
    expect(selectionView(batch(), config.entity).busy).toBe(false);
    const noun = { experiments: 'experiment', flags: 'feature flag', segments: 'segment' }[config.entity];
    expect(notifications.showWarning).toHaveBeenCalledWith(
      `1 ${noun} deleted. 1 item was not attempted. Deletion could not be confirmed for some items.`
    );
    expect(notifications.showWarning).toHaveBeenCalledTimes(1);
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(notifications.showError).not.toHaveBeenCalled();
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
    expect(data[config.fetchMethod]).toHaveBeenCalledTimes(fetchCount + 1);
  });

  it('retains uncertain selections and reports an error once about a malformed deletion response', () => {
    selectRows();
    const snapshot = prepare();
    store.dispatch(actions.batchDeleteRequested({ snapshot }));
    response.next({ phase: 'executed', results: [] });
    expect(batch().operation.result.results.every((result) => result.outcome === 'unknown')).toBe(true);
    expect(Object.keys(batch().selectedById)).toHaveLength(3);
    expect(batch().operation.status).toBe('complete');
    expect(selectionView(batch(), config.entity).busy).toBe(false);
    expect(data.batchDelete).toHaveBeenCalledTimes(1);
    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(notifications.showWarning).not.toHaveBeenCalled();
    expect(notifications.showError).toHaveBeenCalledWith('Deletion could not be confirmed for some items.');
    expect(notifications.showError).toHaveBeenCalledTimes(1);
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
});
