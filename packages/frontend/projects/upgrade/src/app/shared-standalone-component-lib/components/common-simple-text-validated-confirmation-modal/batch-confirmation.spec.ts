import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { BatchDeleteEntity } from 'upgrade_types';
import { initialRootBatchState, RootBatchState } from '../../../core/batch-actions/batch-actions.models';
import { DialogService } from '../../../shared/services/common-dialog.service';
import { CommonSimpleTextValidatedConfirmationModalComponent } from './common-simple-text-validated-confirmation-modal.component';

const translations = jest.requireActual('../../../../assets/i18n/en.json');

describe('Batch deletion using the existing text confirmation dialog', () => {
  let ref: MatDialogRef<CommonSimpleTextValidatedConfirmationModalComponent, boolean>;
  let state$: BehaviorSubject<RootBatchState>;
  let container: HTMLElement;
  const primary = () => container.querySelector('.footer-container button:not(.cancel-btn)') as HTMLButtonElement;
  function detect() {
    ref.componentRef.changeDetectorRef.detectChanges();
    tick();
  }
  function open(entity: BatchDeleteEntity = 'experiments', count = 1, hidden = 0) {
    const snapshot = {
      operationId: 'operation',
      revision: 1,
      notShownCount: hidden,
      items: Array.from({ length: count }, (_, index) => ({ id: String(index), name: `Item ${index}` })),
    };
    state$ = new BehaviorSubject({ ...initialRootBatchState, confirmation: snapshot });
    ref = TestBed.inject(DialogService).openBatchDeleteModal(entity, snapshot, { state$ } as any);
    detect();
  }
  function input(value: string) {
    const field = container.querySelector('input');
    field.value = value;
    field.dispatchEvent(new Event('input'));
    detect();
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonSimpleTextValidatedConfirmationModalComponent,
        MatDialogModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', translations);
    translate.use('en');
    container = TestBed.inject(OverlayContainer).getContainerElement();
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    state$?.complete();
    TestBed.resetTestingModule();
  });

  it.each([
    ['experiments', 1, 'Delete Experiments', '1 experiment'],
    ['experiments', 3, 'Delete Experiments', '3 experiments'],
    ['flags', 1, 'Delete Feature Flags', '1 feature flag'],
    ['flags', 3, 'Delete Feature Flags', '3 feature flags'],
    ['segments', 1, 'Delete Segments', '1 segment'],
    ['segments', 3, 'Delete Segments', '3 segments'],
  ] as const)(
    'uses common confirmation for %s with %i items',
    fakeAsync((entity, count, title, phrase) => {
      open(entity, count, 1);
      expect(ref.componentInstance).toBeInstanceOf(CommonSimpleTextValidatedConfirmationModalComponent);
      expect(container.querySelector('h4').textContent).toBe(title);
      expect(container.textContent).toContain(`Are you sure you want to delete ${phrase}?`);
      expect(container.textContent).toContain('1 selected item is not shown');
      expect((container.querySelector('.cdk-overlay-pane') as HTMLElement).style.width).toBe('480px');
      expect(container.querySelector('input').autocomplete).toBe('off');
      expect(primary().classList.contains('mat-warn')).toBe(true);
      expect(primary().disabled).toBe(true);
    })
  );

  it('closes with confirmation before deletion, without any progress or result screen', fakeAsync(() => {
    open();
    const closed = jest.fn();
    ref.afterClosed().subscribe(closed);
    input('wrong');
    expect(primary().disabled).toBe(true);
    input(' DeLeTe ');
    expect(primary().disabled).toBe(false);
    primary().click();
    detect();
    expect(closed).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledWith(true);
    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0);
    expect(container.textContent).not.toContain('Deleting');
    expect(container.querySelector('mat-progress-bar')).toBeNull();
  }));

  it.each(['cancel', 'close'])(
    'allows %s without confirming',
    fakeAsync((action) => {
      open();
      const closed = jest.fn();
      ref.afterClosed().subscribe(closed);
      (container.querySelector(`.${action}-btn`) as HTMLElement).click();
      tick();
      expect(closed).toHaveBeenCalledTimes(1);
      expect(closed).not.toHaveBeenCalledWith(true);
    })
  );

  it('ignores Escape and backdrop clicks', fakeAsync(() => {
    open();
    container
      .querySelector('mat-dialog-container')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    (container.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    tick();
    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(1);
  }));

  it('disables confirmation when selection or permissions invalidate its snapshot', fakeAsync(() => {
    open();
    input('delete');
    state$.next({ ...state$.value, confirmation: null });
    detect();
    expect(primary().disabled).toBe(true);
  }));
});
