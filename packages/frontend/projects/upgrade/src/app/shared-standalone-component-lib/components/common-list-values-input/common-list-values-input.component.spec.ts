import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonListValuesInputComponent } from './common-list-values-input.component';

describe('CommonListValuesInputComponent', () => {
  let component: CommonListValuesInputComponent;
  let fixture: ComponentFixture<CommonListValuesInputComponent>;
  let onChange: jest.Mock;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CommonListValuesInputComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CommonListValuesInputComponent);
    component = fixture.componentInstance;
    onChange = jest.fn();
    component.registerOnChange(onChange);

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      global: {
        search: { text: 'Search' },
      },
      lists: {
        values: {
          'duplicates-not-added': { text: '{{count}} duplicate value(s) were not added.' },
          'edit-empty-error': { text: 'Value cannot be empty.' },
          'edit-duplicate-error': { text: 'This value already exists in the list.' },
          'separator-hint': { text: 'Click Add (+) or press Enter to add values.' },
          'value-header': { text: 'Value' },
        },
      },
    });
    translate.use('en');
    fixture.detectChanges();
  });

  it('keeps the import action available when committed values exist and pending input is empty', () => {
    component.writeValue(['existing']);
    fixture.detectChanges();

    expect(component.hasPendingValue).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.field-action-button .material-symbols-outlined').textContent.trim()
    ).toBe('upload');
  });

  it('shows the add action while pending input contains text', () => {
    component.pendingValueControl.setValue('new-value');
    fixture.detectChanges();

    expect(component.hasPendingValue).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.field-action-button .material-symbols-outlined').textContent.trim()
    ).toBe('add_circle');
  });

  it('uses the existing search field pattern', () => {
    const searchField = fixture.nativeElement.querySelector('mat-form-field.search-input');
    const searchInput = searchField.querySelector('input[matinput]');
    const searchIcon = searchField.querySelector('mat-icon.search-icon');

    expect(searchField.getAttribute('appearance')).toBeNull();
    expect(searchInput.getAttribute('placeholder')).toBe('Search');
    expect(searchIcon.textContent.trim()).toBe('search');
  });

  it('moves the total value count into the table header', () => {
    fixture.componentRef.setInput('label', 'Values');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.values-heading')).toBeNull();
    expect(fixture.nativeElement.querySelector('th.value-column').textContent.replace(/\s+/g, ' ').trim()).toBe(
      'Value (0)'
    );
  });

  it('uses the existing required mat-label and configured placeholder patterns', () => {
    fixture.componentRef.setInput('label', 'Values');
    fixture.componentRef.setInput('placeholder', 'Values separated by commas');
    fixture.detectChanges();

    const valueField = fixture.nativeElement.querySelector('.value-input');
    const inputLabel = valueField.querySelector('mat-label');
    const valueInput = valueField.querySelector('input[matinput]');

    expect(inputLabel.textContent.replace(/\s+/g, ' ').trim()).toBe('Values *');
    expect(valueInput.getAttribute('placeholder')).toBe('Values separated by commas');
  });

  it('does not show a required error after the empty input is focused and blurred', () => {
    const valueInput = fixture.nativeElement.querySelector('.value-input input[matinput]');

    valueInput.dispatchEvent(new Event('focus'));
    valueInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('At least one value is required');
    expect(fixture.nativeElement.querySelector('.invalid-section')).toBeNull();
  });

  it('places the import action in the form-field infix like the existing Values input', () => {
    const valueField = fixture.nativeElement.querySelector('.value-input');

    expect(valueField.querySelector('.mat-mdc-form-field-infix > .field-action-button')).not.toBeNull();
    expect(valueField.querySelector('.mat-mdc-form-field-icon-suffix .field-action-button')).toBeNull();
  });

  it('uses the existing download symbol in the Actions header', () => {
    component.writeValue(['existing']);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.export-button .material-symbols-outlined').textContent.trim()).toBe(
      'download'
    );
  });

  it('renders an empty Material table with its standard no-data row', () => {
    component.writeValue([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table[mat-table].values-table')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tr.mat-mdc-no-data-row')).not.toBeNull();
  });

  it('adds multiple pending values in order and clears the input', () => {
    component.writeValue(['existing']);
    component.pendingValueControl.setValue('first,second\tthird');

    component.commitPendingValues();

    expect(onChange).toHaveBeenLastCalledWith(['existing', 'first', 'second', 'third']);
    expect(component.pendingValueControl.value).toBe('');
  });

  it('keeps comma-separated input pending until the Add action is selected', () => {
    component.pendingValueControl.setValue('first,second');
    const commaEvent = {
      key: ',',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as KeyboardEvent;

    component.onPendingValueKeydown(commaEvent);

    expect(commaEvent.preventDefault).not.toHaveBeenCalled();
    expect(component.pendingValueControl.value).toBe('first,second');
    expect(component.rows).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds pending input when Enter is pressed', () => {
    component.pendingValueControl.setValue('pending-value');
    const enterEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as KeyboardEvent;

    component.onPendingValueKeydown(enterEvent);

    expect(enterEvent.preventDefault).toHaveBeenCalled();
    expect(enterEvent.stopPropagation).toHaveBeenCalled();
    expect(component.pendingValueControl.value).toBe('');
    expect(component.rows.map((row) => row.value)).toEqual(['pending-value']);
    expect(onChange).toHaveBeenLastCalledWith(['pending-value']);
  });

  it('does not intercept Tab so keyboard focus can move to the Add action', () => {
    component.pendingValueControl.setValue('pending-value');
    const tabEvent = {
      key: 'Tab',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as KeyboardEvent;

    component.onPendingValueKeydown(tabEvent);

    expect(tabEvent.preventDefault).not.toHaveBeenCalled();
    expect(tabEvent.stopPropagation).not.toHaveBeenCalled();
    expect(component.pendingValueControl.value).toBe('pending-value');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps pasted multi-value input pending for the Add action', () => {
    const pasteEvent = {
      clipboardData: { getData: () => 'first\nsecond\tthird' },
      preventDefault: jest.fn(),
      target: { selectionStart: 0, selectionEnd: 0 },
    } as unknown as ClipboardEvent;

    component.onPendingValuePaste(pasteEvent);

    expect(pasteEvent.preventDefault).toHaveBeenCalled();
    expect(component.pendingValueControl.value).toBe('first,second,third');
    expect(component.rows).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('explains that the Add action commits pending values', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.separator-hint').textContent.trim()).toBe(
      'Click Add (+) or press Enter to add values.'
    );
  });

  it('reports pending text until the value is explicitly added', () => {
    const pendingStateChanged = jest.spyOn(component.pendingStateChanged, 'emit');
    component.pendingValueControl.setValue('new-value');

    expect(component.hasPendingChanges).toBe(true);
    expect(pendingStateChanged).toHaveBeenLastCalledWith(true);

    component.commitPendingValues();

    expect(component.hasPendingChanges).toBe(false);
    expect(pendingStateChanged).toHaveBeenLastCalledWith(false);
  });

  it('reports duplicate values instead of adding them', () => {
    component.writeValue(['existing']);
    component.pendingValueControl.setValue('new,existing,new');

    component.commitPendingValues();

    expect(onChange).toHaveBeenLastCalledWith(['existing', 'new']);
    expect(component.feedbackMessage).toContain('2');
  });

  it('filters visible rows without changing the form value', () => {
    component.writeValue(['Alpha', 'Beta', 'alphabet']);
    onChange.mockClear();

    component.searchControl.setValue('alpha');

    expect(component.filteredRows.map((row) => row.value)).toEqual(['Alpha', 'alphabet']);
    expect(onChange).not.toHaveBeenCalled();
    expect(component.displayedValueCount).toBe(3);
  });

  it('prevents an inline edit from creating a duplicate', () => {
    component.writeValue(['first', 'second']);
    const secondRow = component.rows[1];
    component.startEdit(secondRow);
    component.editValueControl.setValue('first');

    component.saveEdit(secondRow);

    expect(component.editingRowId).toBe(secondRow.id);
    expect(component.editErrorMessage).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports an inline edit as pending until it is saved or cancelled', () => {
    const pendingStateChanged = jest.spyOn(component.pendingStateChanged, 'emit');
    component.writeValue(['first']);

    component.startEdit(component.rows[0]);
    expect(pendingStateChanged).toHaveBeenLastCalledWith(true);

    component.cancelEdit();
    expect(pendingStateChanged).toHaveBeenLastCalledWith(false);
  });

  it('edits and deletes values while preserving the remaining order', () => {
    component.writeValue(['first', 'second', 'third']);
    const secondRow = component.rows[1];
    component.startEdit(secondRow);
    component.editValueControl.setValue('updated');
    component.saveEdit(secondRow);
    component.deleteValue(component.rows[0]);

    expect(onChange).toHaveBeenLastCalledWith(['updated', 'third']);
  });

  it('opens and closes the import helper without changing values', () => {
    const pendingStateChanged = jest.spyOn(component.pendingStateChanged, 'emit');
    component.writeValue(['existing']);
    onChange.mockClear();

    component.openImportHelper(new MouseEvent('click'));
    expect(component.showImportHelper).toBe(true);
    expect(pendingStateChanged).toHaveBeenLastCalledWith(true);

    component.closeImportHelper(new MouseEvent('click'));
    expect(component.showImportHelper).toBe(false);
    expect(pendingStateChanged).toHaveBeenLastCalledWith(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('loads valid CSV values into the pending input without changing the table', async () => {
    component.writeValue(['existing']);
    onChange.mockClear();
    component.openImportHelper(new MouseEvent('click'));

    await component.handleFilesSelected([new File(['new\nexisting\nanother'], 'values.csv', { type: 'text/csv' })]);
    fixture.detectChanges();

    expect(component.showImportHelper).toBe(false);
    expect(component.pendingValueControl.value).toBe('new, existing, another');
    expect(component.rows.map((row) => row.value)).toEqual(['existing']);
    expect(onChange).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.import-review-container')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.field-action-button .material-symbols-outlined').textContent.trim()
    ).toBe('add_circle');
  });

  it('keeps imported values pending until Add or Enter explicitly commits them', async () => {
    const pendingStateChanged = jest.spyOn(component.pendingStateChanged, 'emit');
    component.writeValue(['existing']);
    onChange.mockClear();

    await component.handleFilesSelected([new File(['imported'], 'values.csv', { type: 'text/csv' })]);
    expect(pendingStateChanged).toHaveBeenLastCalledWith(true);
    expect(onChange).not.toHaveBeenCalled();

    component.commitPendingValues();

    expect(onChange).toHaveBeenLastCalledWith(['existing', 'imported']);
    expect(pendingStateChanged).toHaveBeenLastCalledWith(false);
  });

  it('keeps valid CSV files in file and row order until they are explicitly added', async () => {
    const firstFile = new File(['first\nsecond'], 'first.csv', { type: 'text/csv' });
    const secondFile = new File(['third'], 'second.csv', { type: 'text/csv' });

    await component.handleFilesSelected([firstFile, secondFile]);

    expect(component.pendingValueControl.value).toBe('first, second, third');
    expect(component.showImportHelper).toBe(false);
    expect(onChange).not.toHaveBeenCalled();

    component.commitPendingValues();

    expect(onChange).toHaveBeenLastCalledWith(['first', 'second', 'third']);
  });

  it('keeps the import helper open when CSV parsing fails', async () => {
    component.openImportHelper(new MouseEvent('click'));
    const invalidFile = new File(['first,second'], 'invalid.csv', { type: 'text/csv' });

    await component.handleFilesSelected([invalidFile]);

    expect(component.importFailed).toBe(true);
    expect(component.showImportHelper).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('exports the full working list rather than filtered rows', () => {
    const downloadRequested = jest.spyOn(component.downloadRequested, 'emit');
    component.writeValue(['first', 'second']);
    component.searchControl.setValue('first');

    component.exportValues();

    expect(downloadRequested).toHaveBeenCalledWith(['first', 'second']);
  });

  it('does not silently commit pending input or an inline edit when the parent form saves', () => {
    component.writeValue(['first']);
    component.pendingValueControl.setValue('second');
    component.startEdit(component.rows[0]);
    component.editValueControl.setValue('updated');

    expect(component.commitPendingChanges()).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(component.rows.map((row) => row.value)).toEqual(['first']);
  });

  it('prevents the parent form from saving until imported input is explicitly added', async () => {
    component.writeValue(['existing']);
    await component.handleFilesSelected([new File(['imported'], 'values.csv', { type: 'text/csv' })]);

    expect(component.commitPendingChanges()).toBe(false);
    expect(component.feedbackMessage).toBeTruthy();
  });
});
