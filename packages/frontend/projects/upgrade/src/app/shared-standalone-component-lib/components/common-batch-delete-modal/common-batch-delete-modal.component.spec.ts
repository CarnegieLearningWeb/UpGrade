import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { BatchDeleteEntity, BatchDeleteResult, UserRole } from 'upgrade_types';
import { RootBatchState, initialRootBatchState } from '../../../core/batch-actions/batch-actions.models';
import { DialogService } from '../../../shared/services/common-dialog.service';
import { CommonBatchDeleteModalComponent } from './common-batch-delete-modal.component';

const translations = jest.requireActual('../../../../assets/i18n/en.json');

describe('Batch delete confirmation', () => {
  let ref: MatDialogRef<CommonBatchDeleteModalComponent>;
  let state$: BehaviorSubject<RootBatchState>;
  let facade: any;
  let container: HTMLElement;

  function open(entity: BatchDeleteEntity = 'experiments', count = 2, hidden = 0) {
    const items = Array.from({ length: count }, (_, index) => ({ id: String(index), name: `Item ${index + 1}` }));
    const snapshot = { operationId: 'operation', revision: 1, items, notShownCount: hidden };
    state$ = new BehaviorSubject({
      ...initialRootBatchState,
      userEmail: 'test@example.com',
      role: UserRole.ADMIN,
      selectedById: Object.fromEntries(items.map((item) => [item.id, item])),
      confirmation: snapshot,
    });
    facade = {
      state$,
      submit: jest.fn(() =>
        state$.next({
          ...state$.value,
          confirmation: null,
          operation: { snapshot, status: 'submitting', reconciledAbsentIds: [] },
        })
      ),
    };
    ref = TestBed.inject(DialogService).openBatchDeleteModal(entity, snapshot, facade);
    detect();
    tick();
  }
  function detect() {
    ref.componentRef.changeDetectorRef.detectChanges();
  }
  function input(value: string) {
    const field = container.querySelector('input') as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    detect();
    tick();
  }
  const primary = () => container.querySelector('.footer-container button:not(.cancel-btn)') as HTMLButtonElement;
  function finish(result: BatchDeleteResult, reconciledAbsentIds: string[] = []) {
    state$.next({
      ...state$.value,
      operation: { ...state$.value.operation, status: 'complete', result, reconciledAbsentIds },
    });
    detect();
    tick();
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonBatchDeleteModalComponent, MatDialogModule, NoopAnimationsModule, TranslateModule.forRoot()],
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
    'uses the fixed %s title with a count of %i',
    fakeAsync((entity, count, title, phrase) => {
      open(entity, count, 1);
      expect(container.querySelector('h4').textContent).toBe(title);
      expect(container.textContent).toContain(`Are you sure you want to delete ${phrase}?`);
      expect(container.textContent).toContain('1 selected item is not shown');
      expect(container.querySelector('label').getAttribute('for')).toBe(container.querySelector('input').id);
      expect(primary().disabled).toBe(true);
      expect(facade.submit).not.toHaveBeenCalled();
      ref.close();
      tick();
    })
  );

  it('requires the keyword, accepts trimmed mixed case, submits once, and blocks dismissal while pending', fakeAsync(() => {
    open();
    input('wrong');
    expect(primary().disabled).toBe(true);
    input(' DeLeTe ');
    expect(primary().disabled).toBe(false);
    primary().click();
    detect();
    tick();
    primary().click();
    container.querySelector('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(facade.submit).toHaveBeenCalledTimes(1);
    expect(facade.submit).toHaveBeenCalledWith('operation');
    expect(ref.disableClose).toBe(true);
    expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    expect(Array.from(container.querySelectorAll('button')).every((button) => button.disabled)).toBe(true);
    expect(container.textContent).toContain('Deleting 2 selected items');
    ref.close();
    tick();
  }));

  it.each(['cancel', 'close', 'escape', 'backdrop'])(
    'allows %s before submission without changing selection',
    fakeAsync((mode) => {
      open();
      if (mode === 'cancel') (container.querySelector('.cancel-btn') as HTMLElement).click();
      if (mode === 'close') (container.querySelector('.close-btn') as HTMLElement).click();
      if (mode === 'escape')
        container
          .querySelector('mat-dialog-container')
          .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      if (mode === 'backdrop') (container.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
      tick();
      expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0);
      expect(facade.submit).not.toHaveBeenCalled();
      expect(Object.keys(state$.value.selectedById)).toHaveLength(2);
    })
  );

  it('closes only its own dialog after confirmed full success', fakeAsync(() => {
    open();
    input('delete');
    primary().click();
    detect();
    finish({
      phase: 'executed',
      results: [
        { id: '0', outcome: 'deleted' },
        { id: '1', outcome: 'deleted' },
      ],
    });
    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0);
  }));

  it('shows per-item partial results and prevents resubmitting the completed snapshot', fakeAsync(() => {
    open();
    input('delete');
    primary().click();
    detect();
    finish({
      phase: 'executed',
      results: [
        { id: '0', outcome: 'deleted' },
        { id: '1', outcome: 'failed' },
      ],
    });
    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('Item 2');
    expect(container.textContent).toContain('Could not be deleted.');
    expect(primary()).toBeNull();
    expect(ref.disableClose).toBe(false);
    expect(container.querySelector('.cancel-btn').textContent.trim()).toBe('Close');
    ref.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledTimes(1);
    ref.close();
    tick();
  }));

  it('keeps a post-commit warning visible even though the item was deleted', fakeAsync(() => {
    open('flags', 1);
    input('delete');
    primary().click();
    detect();
    finish({ phase: 'executed', results: [{ id: '0', outcome: 'deleted', reasonCode: 'post_delete_failed' as any }] });
    expect(container.textContent).toContain('Deleted, but related updates could not be completed.');
    expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(1);
    ref.close();
    tick();
  }));

  it('distinguishes unconfirmed absences and keeps dismissal blocked during reconciliation', fakeAsync(() => {
    open('segments', 1);
    input('delete');
    primary().click();
    detect();
    state$.next({ ...state$.value, operation: { ...state$.value.operation, status: 'reconciling' } });
    detect();
    expect(ref.disableClose).toBe(true);
    expect(container.textContent).toContain('Checking the remaining items');
    finish({ phase: 'executed', results: [{ id: '0', outcome: 'unknown' }] }, ['0']);
    expect(container.textContent).toContain("this request's deletion outcome could not be confirmed");
    expect(container.textContent).toContain('The original request may still be running');
    ref.close();
    tick();
  }));

  it('blocks a stale confirmation when permissions or selection change before submission', fakeAsync(() => {
    open();
    input('delete');
    state$.next({ ...state$.value, confirmation: null });
    detect();
    expect(primary().disabled).toBe(true);
    expect(container.textContent).toContain('selection or permissions have changed');
    ref.componentInstance.submit();
    expect(facade.submit).not.toHaveBeenCalled();
    ref.close();
    tick();
  }));
});
