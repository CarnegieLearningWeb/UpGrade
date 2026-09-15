import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject, Subscription, of } from 'rxjs';
import { EXPERIMENT_STATE, FEATURE_FLAG_STATUS, SEGMENT_STATUS, SEGMENT_TYPE, UserRole } from 'upgrade_types';
import { ExperimentRootSectionCardComponent } from './experiments/pages/experiment-root-page/experiment-root-page-content/experiment-root-section-card/experiment-root-section-card.component';
import { FeatureFlagRootSectionCardComponent } from './feature-flags/pages/feature-flag-root-page/feature-flag-root-page-content/feature-flag-root-section-card/feature-flag-root-section-card.component';
import { SegmentRootSectionCardComponent } from './segments/pages/segment-root-page/segment-root-page-content/segment-root-section-card/segment-root-section-card.component';
import { ExperimentService } from '../../core/experiments/experiments.service';
import { FeatureFlagsService } from '../../core/feature-flags/feature-flags.service';
import { SegmentsService } from '../../core/segments/segments.service';
import { AuthService } from '../../core/auth/auth.service';
import { StratificationFactorsService } from '../../core/stratification-factors/stratification-factors.service';
import { DialogService } from '../../shared/services/common-dialog.service';
import { createBatchFacade } from '../../core/batch-actions/batch-actions.facade';
import { RootBatchActionsDirective } from '../../shared/directives/root-batch-actions.directive';
import { actionSetUserInfo } from '../../core/auth/store/auth.actions';
import { experimentsReducer } from '../../core/experiments/store/experiments.reducer';
import { featureFlagsReducer } from '../../core/feature-flags/store/feature-flags.reducer';
import { segmentsReducer } from '../../core/segments/store/segments.reducer';
import * as experiments from '../../core/experiments/store/experiments.actions';
import * as flags from '../../core/feature-flags/store/feature-flags.actions';
import * as segments from '../../core/segments/store/segments.actions';

const translations = jest.requireActual('../../../assets/i18n/en.json');
const cases = [
  {
    entity: 'experiments',
    key: 'experiments',
    component: ExperimentRootSectionCardComponent,
    token: ExperimentService,
    actions: experiments,
  },
  {
    entity: 'flags',
    key: 'featureFlags',
    component: FeatureFlagRootSectionCardComponent,
    token: FeatureFlagsService,
    actions: flags,
  },
  {
    entity: 'segments',
    key: 'segments',
    component: SegmentRootSectionCardComponent,
    token: SegmentsService,
    actions: segments,
  },
] as const;

describe.each(cases)('$entity root batch UI', (config) => {
  let fixture: ComponentFixture<any>;
  let store: Store<any>;
  let state: any;
  let subscription: Subscription;
  let service: any;
  let dialogs: any;
  let closed: Subject<boolean | undefined>;
  let overlay: OverlayContainer;
  let permissions$: BehaviorSubject<any>;
  let listLoading$: BehaviorSubject<boolean>;
  const actions = config.actions.batchActions;
  const rows = ['Alpha', 'Beta'].map((name, index) => ({
    id: `11111111-2222-4333-8444-${String(index + 1).padStart(12, '0')}`,
    name,
    description: 'Description',
    context: ['test'],
    tags: [],
    state: config.entity === 'experiments' ? EXPERIMENT_STATE.INACTIVE : undefined,
    status: config.entity === 'segments' ? SEGMENT_STATUS.UNUSED : FEATURE_FLAG_STATUS.DISABLED,
    type: SEGMENT_TYPE.PUBLIC,
  }));
  const batch = () => state[config.key].rootBatch;
  const checkboxes = (): HTMLInputElement[] => [...fixture.nativeElement.querySelectorAll('input[type=checkbox]')];
  function load(items = rows) {
    const action =
      config.entity === 'experiments'
        ? experiments.actionGetExperimentsSuccess({
            experiments: items as any,
            totalExperiments: items.length,
            fromStarting: true,
          })
        : config.entity === 'flags'
        ? flags.actionFetchFeatureFlagsSuccess({ flags: items as any, totalFlags: items.length, fromStarting: true })
        : segments.actionFetchSegmentsSuccess({
            segments: items as any,
            totalSegments: items.length,
            fromStarting: true,
            experimentSegmentInclusion: [],
            experimentSegmentExclusion: [],
            featureFlagSegmentInclusion: [],
            featureFlagSegmentExclusion: [],
            allParentSegments: [],
          });
    store.dispatch(action);
  }
  function selectFirst() {
    checkboxes()[1].click();
    fixture.detectChanges();
  }
  function openMenu() {
    fixture.nativeElement.querySelector('.section-card-menu-trigger').click();
    fixture.detectChanges();
    tick();
  }
  beforeEach(async () => {
    permissions$ = new BehaviorSubject({
      experiments: { create: true },
      featureFlags: { create: true },
      segments: { create: true },
    });
    global.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() })) as any;
    await TestBed.configureTestingModule({
      imports: [
        config.component,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        StoreModule.forRoot({
          experiments: experimentsReducer,
          featureFlags: featureFlagsReducer,
          segments: segmentsReducer,
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: config.token, useFactory: () => service },
        {
          provide: AuthService,
          useValue: {
            userPermissions$: permissions$,
          },
        },
        { provide: StratificationFactorsService, useValue: { fetchStratificationFactors: jest.fn() } },
        { provide: DialogService, useFactory: () => dialogs },
      ],
    }).compileComponents();
    store = TestBed.inject(Store);
    subscription = store.subscribe((value) => (state = value));
    store.dispatch(actionSetUserInfo({ user: { email: 'test@example.com', role: UserRole.ADMIN } }));
    load();
    const batchFacade = createBatchFacade(
      store,
      config.entity,
      actions,
      (s) => s[config.key].rootBatch,
      (s) => s[config.key][config.key]
    );
    const rows$ = store.select((s) => s[config.key][config.key]);
    listLoading$ = new BehaviorSubject(false);
    service = {
      batch: batchFacade,
      experiments$: rows$,
      featureFlags$: rows$,
      selectAllSegments$: rows$,
      isLoadingExperiment$: listLoading$,
      isLoadingFeatureFlags$: listLoading$,
      isLoadingSegments$: listLoading$,
      haveInitialExperimentsLoaded: () => of(true),
      isInitialFeatureFlagsLoading$: of(true),
      isInitialSegmentsLoading: () => of(true),
      selectSearchString$: of(''),
      searchString$: of(''),
      selectSearchKey$: of('name'),
      searchKey$: of('name'),
      searchParams$: of({}),
      selectRootTableState$: of({}),
      selectExperimentSortKey$: of('name'),
      selectExperimentSortAs$: of('ASC'),
      sortKey$: of('name'),
      sortAs$: of('ASC'),
      selectSegmentSortKey$: of('name'),
      selectSegmentSortAs$: of('ASC'),
      warningKeysForAllExperiments$: of({}),
      warningKeysForAllFlags$: of({}),
      loadExperiments: jest.fn(),
      fetchFeatureFlags: jest.fn(),
      fetchSegmentsPaginated: jest.fn(),
      fetchAllExperimentNames: jest.fn(),
      setSearchParams: jest.fn(),
      setSearchString: jest.fn(),
      setSearchKey: jest.fn(),
      setSortingType: jest.fn(),
      setSortKey: jest.fn(),
    };
    closed = new Subject();
    dialogs = { openBatchDeleteModal: jest.fn(() => ({ afterClosed: () => closed, close: jest.fn() })) };
    overlay = TestBed.inject(OverlayContainer);
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', translations);
    translate.use('en');
    fixture = TestBed.createComponent(config.component as any);
    fixture.detectChanges();
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    subscription.unsubscribe();
    closed.complete();
    TestBed.resetTestingModule();
  });

  it('keeps checkbox clicks and Space separate from Name sorting and detail links', () => {
    const input = checkboxes()[1];
    expect(input.getAttribute('aria-label')).toContain('Alpha');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    selectFirst();
    expect(Object.keys(batch().selectedById)).toEqual([rows[0].id]);
    expect(service.setSortKey).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('1 Selected');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toContain(rows[0].id);
    fixture.nativeElement.querySelector('.batch-name-sort .mat-sort-header-container').click();
    expect(service.setSortKey).toHaveBeenCalledWith('name');
  });

  it('clears a mixed header visually and keeps subsequent select-all toggles synchronized', fakeAsync(() => {
    selectFirst();
    const header = checkboxes()[0];
    expect(header.indeterminate).toBe(true);
    expect(header.getAttribute('aria-label')).toBe('Clear all selections');

    header.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
    expect(header.checked).toBe(false);
    expect(header.indeterminate).toBe(false);
    expect(header.getAttribute('aria-label')).toBe('Select all loaded items');

    header.click();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(rows.length);
    expect(header.checked).toBe(true);
    expect(header.indeterminate).toBe(false);

    header.click();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
    expect(checkboxes().every((input) => !input.checked && !input.indeterminate)).toBe(true);
  }));

  it('retains a mixed header with no matching rows and clears hidden selections to restore Import', fakeAsync(() => {
    selectFirst();
    load([]);
    fixture.detectChanges();
    expect(checkboxes()).toHaveLength(1);
    expect(checkboxes()[0].indeterminate).toBe(true);
    expect(checkboxes()[0].getAttribute('aria-label')).toBe('Clear all selections');
    expect(fixture.nativeElement.textContent).toContain('1 Selected');
    checkboxes()[0].click();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
    expect(checkboxes()[0].checked).toBe(false);
    expect(checkboxes()[0].indeterminate).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Selected');
    openMenu();
    expect(overlay.getContainerElement().textContent).toContain('Import');
    expect(overlay.getContainerElement().textContent).not.toContain('Delete');
  }));

  it('opens one immutable confirmation immediately from the selection including hidden items', fakeAsync(() => {
    checkboxes()[0].click();
    fixture.detectChanges();
    load([rows[0]]);
    fixture.detectChanges();
    openMenu();
    const menuItem = overlay.getContainerElement().querySelector('button[mat-menu-item]') as HTMLButtonElement;
    expect(menuItem.textContent).toContain('Delete');
    menuItem.click();
    fixture.detectChanges();
    tick();
    expect(dialogs.openBatchDeleteModal).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.selection-status')).toBeNull();
    const [entity, snapshot] = dialogs.openBatchDeleteModal.mock.calls[0];
    expect(entity).toBe(config.entity);
    expect(snapshot.items.map((item) => item.id)).toEqual(rows.map((row) => row.id));
    closed.next(undefined);
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(2);
    expect(batch().confirmation).toBeNull();
  }));

  it('keeps a disabled menu discoverable to a Reader and allows clearing the selection', () => {
    store.dispatch(actionSetUserInfo({ user: { email: 'test@example.com', role: UserRole.READER } }));
    selectFirst();
    const trigger = fixture.nativeElement.querySelector('.section-card-menu-trigger') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    expect(trigger.parentElement.getAttribute('tabindex')).toBe('0');
    expect(trigger.parentElement.getAttribute('aria-label')).toContain('permission');
    checkboxes()[0].click();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
  });

  it('preserves selection across collapse and removes tag expansion only for confirmed removals', () => {
    selectFirst();
    fixture.componentInstance.onTagsExpanded(rows[0].id, true);
    fixture.componentInstance.onTagsExpanded(rows[1].id, true);
    fixture.componentInstance.onSectionCardExpandChange(false);
    fixture.detectChanges();
    fixture.componentInstance.onSectionCardExpandChange(true);
    fixture.detectChanges();
    expect(checkboxes()[1].checked).toBe(true);
    store.dispatch(actions.confirmedRemoved({ ids: [rows[0].id] }));
    fixture.detectChanges();
    expect(fixture.componentInstance.expandedTagsMap.has(rows[0].id)).toBe(false);
    expect(fixture.componentInstance.expandedTagsMap.has(rows[1].id)).toBe(true);
    expect(fixture.debugElement.query(By.directive(RootBatchActionsDirective))).toBeTruthy();
  });

  it('clears selection on leaving the root page and starts empty when returning', () => {
    selectFirst();
    fixture.destroy();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
    expect(batch().confirmation).toBeNull();
    fixture = TestBed.createComponent(config.component as any);
    fixture.detectChanges();
    expect(checkboxes().every((input) => !input.checked && !input.indeterminate)).toBe(true);
  });

  it('clears navigation selection without discarding an in-flight deletion or its result', () => {
    selectFirst();
    service.batch.prepareConfirmation();
    const snapshot = batch().confirmation;
    service.batch.submit(snapshot.operationId);
    fixture.destroy();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
    expect(batch().operation.snapshot).toEqual(snapshot);
    expect(batch().operation.status).toBe('submitting');
    store.dispatch(
      actions.batchDeleteCompleted({
        operationId: snapshot.operationId,
        result: { phase: 'executed', results: [{ id: rows[0].id, outcome: 'deleted' }] },
      })
    );
    expect(batch().operation.status).toBe('complete');
    expect(batch().removedIds).toContain(rows[0].id);
  });

  it('starts deletion only after the common dialog closes with confirmation', fakeAsync(() => {
    selectFirst();
    service.batch.prepareConfirmation();
    const snapshot = batch().confirmation;
    expect(batch().operation?.status).not.toBe('submitting');
    closed.next(true);
    fixture.detectChanges();
    expect(batch().operation.snapshot).toEqual(snapshot);
    expect(batch().operation.status).toBe('submitting');
    expect(batch().confirmation).toBeNull();
    service.batch.prepareConfirmation();
    expect(dialogs.openBatchDeleteModal).toHaveBeenCalledTimes(1);
  }));

  it.each(['cancel', 'close', 'confirm'] as const)(
    'uses the common dialog and does not refocus the menu trigger after %s',
    fakeAsync((action) => {
      const realDialogs = new DialogService(TestBed.inject(MatDialog), TestBed.inject(TranslateService));
      dialogs.openBatchDeleteModal.mockImplementation((entity, snapshot, facade) =>
        realDialogs.openBatchDeleteModal(entity, snapshot, facade)
      );
      selectFirst();
      openMenu();
      const item = overlay.getContainerElement().querySelector('button[mat-menu-item]') as HTMLButtonElement;
      expect(item.textContent.trim()).toBe(translations[`batch-delete.dialog.${config.entity}.title`]);
      item.focus();
      item.click();
      fixture.detectChanges();
      tick();
      const ref = dialogs.openBatchDeleteModal.mock.results[0].value;
      const container = overlay.getContainerElement();
      const input = container.querySelector('input') as HTMLInputElement;
      input.focus();
      const trigger = fixture.nativeElement.querySelector('.section-card-menu-trigger') as HTMLButtonElement;
      const focus = jest.spyOn(trigger, 'focus');
      if (action === 'confirm') {
        input.value = 'delete';
        input.dispatchEvent(new Event('input'));
        ref.componentRef.changeDetectorRef.detectChanges();
        tick();
        (container.querySelector('.footer-container button:not(.cancel-btn)') as HTMLButtonElement).click();
      } else {
        (container.querySelector(`.${action}-btn`) as HTMLButtonElement).click();
      }
      tick();
      fixture.detectChanges();
      expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0);
      expect(focus).not.toHaveBeenCalled();
      expect(document.activeElement).not.toBe(trigger);
      expect(batch().confirmation).toBeNull();
      expect(batch().operation?.status === 'submitting').toBe(action === 'confirm');
      focus.mockRestore();
    })
  );

  it('separates User Manager delete permission from create permission', () => {
    permissions$.next({ experiments: { create: false }, featureFlags: { create: false }, segments: { create: false } });
    store.dispatch(actionSetUserInfo({ user: { email: 'test@example.com', role: UserRole.USER_MANAGER } }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-card-menu-trigger')).toBeNull();
    selectFirst();
    const trigger = fixture.nativeElement.querySelector('.section-card-menu-trigger') as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    expect(trigger.disabled).toBe(config.entity !== 'segments');
  });

  it.each(['list', 'deletion'])('keeps the existing progress bar until both requests finish (%s first)', (first) => {
    const progressBar = () => fixture.nativeElement.querySelector('mat-progress-bar');
    selectFirst();
    expect(progressBar()).toBeNull();
    store.dispatch(actions.prepareConfirmation({ operationId: 'pending-delete' }));
    store.dispatch(actions.batchDeleteRequested({ snapshot: batch().confirmation }));
    fixture.detectChanges();
    expect(progressBar()).not.toBeNull();
    const trigger = fixture.debugElement.query(By.css('.section-card-menu-trigger'));
    expect(trigger.nativeElement.disabled).toBe(true);
    expect(trigger.parent.injector.get(MatTooltip).message).toBe('');

    listLoading$.next(true);
    const finishDeletion = () =>
      store.dispatch(
        actions.batchDeleteCompleted({
          operationId: 'pending-delete',
          result: { phase: 'executed', results: [{ id: rows[0].id, outcome: 'deleted' }] },
        })
      );
    if (first === 'list') listLoading$.next(false);
    else finishDeletion();
    fixture.detectChanges();
    expect(progressBar()).not.toBeNull();

    if (first === 'list') finishDeletion();
    else listLoading$.next(false);
    fixture.detectChanges();
    expect(progressBar()).toBeNull();
  });

  it('keeps checkboxes usable without a banner or reload button after request and refresh failures', () => {
    selectFirst();
    store.dispatch(actions.prepareConfirmation({ operationId: 'offline-delete' }));
    store.dispatch(actions.batchDeleteRequested({ snapshot: batch().confirmation }));
    fixture.detectChanges();
    expect(checkboxes()[1].disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).not.toBeNull();
    store.dispatch(actions.batchDeleteRequestFailed({ operationId: 'offline-delete', status: 0 }));
    fixture.detectChanges();
    expect(checkboxes().every((input) => !input.disabled)).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeNull();
    checkboxes()[1].click();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(0);
    checkboxes()[1].click();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(1);

    store.dispatch(actions.listRequested({ requestId: 'failed-refresh' }));
    store.dispatch(actions.listFailed({ requestId: 'failed-refresh' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-common-batch-selection-status')).toBeNull();
    expect(fixture.nativeElement.querySelector('.selection-status')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Reload list');
    checkboxes()[2].click();
    fixture.detectChanges();
    expect(Object.keys(batch().selectedById)).toHaveLength(2);
  });

  it('explains a hidden restriction only in the menu tooltip without inserting a status row', () => {
    load([
      {
        ...rows[0],
        state: config.entity === 'experiments' ? EXPERIMENT_STATE.DRAFT : undefined,
        status: config.entity === 'segments' ? SEGMENT_STATUS.USED : FEATURE_FLAG_STATUS.ENABLED,
      },
    ]);
    fixture.detectChanges();
    selectFirst();
    load([]);
    fixture.detectChanges();
    fixture.componentInstance.batchUi.requestDelete();
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.section-card-menu-trigger') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    expect(trigger.parentElement.getAttribute('aria-label')).toContain('Deselect');
    expect(fixture.nativeElement.querySelector('.selection-status')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Refresh selection status');
    expect(Object.keys(batch().selectedById)).toEqual([rows[0].id]);
    expect(dialogs.openBatchDeleteModal).not.toHaveBeenCalled();
  });
});
