import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

import { EditConditionWeightsModalComponent } from './edit-condition-weights-modal.component';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';

describe('EditConditionWeightsModalComponent', () => {
  let component: EditConditionWeightsModalComponent;
  let fixture: ComponentFixture<EditConditionWeightsModalComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<EditConditionWeightsModalComponent>>;

  const mockDialogData = {
    title: 'Edit Condition Weights',
    primaryActionBtnLabel: 'Update',
    cancelBtnLabel: 'Cancel',
    params: {
      experimentWeightsArray: [
        { conditionId: '1', conditionCode: 'Control', assignmentWeight: 50 },
        { conditionId: '2', conditionCode: 'Treatment', assignmentWeight: 50 },
      ],
    },
  };

  const setupComponent = async (data = mockDialogData) => {
    mockDialogRef = {
      close: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        EditConditionWeightsModalComponent,
        CommonModalComponent,
        ReactiveFormsModule,
        MatTableModule,
        MatRadioModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        CommonModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditConditionWeightsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    return { component, fixture, mockDialogRef };
  };

  beforeEach(async () => {
    await setupComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with correct structure', () => {
      expect(component.conditionWeightForm).toBeDefined();
      expect(component.conditionWeightForm.get('weightingMethod')).toBeDefined();
      expect(component.conditionWeightForm.get('conditions')).toBeDefined();
    });

    it('should initialize with null weighting method', () => {
      expect(component.conditionWeightForm.get('weightingMethod')?.value).toBeNull();
    });

    it('should create form array with correct number of conditions', () => {
      expect(component.conditionsFormArray.length).toBe(2);
    });

    it('should initialize conditions with provided data', () => {
      const firstCondition = component.conditionsFormArray.at(0);
      expect(firstCondition.get('conditionCode')?.value).toBe('Control');
      expect(firstCondition.get('assignmentWeight')?.value).toBe(50);
    });

    it('should initially disable weight inputs', () => {
      component.conditionsFormArray.controls.forEach((control) => {
        expect(control.get('assignmentWeight')?.disabled).toBe(true);
      });
    });
  });

  describe('Weighting Method Changes', () => {
    it('should enable weight inputs when custom method is selected', () => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('custom');
      fixture.detectChanges();

      component.conditionsFormArray.controls.forEach((control) => {
        expect(control.get('assignmentWeight')?.enabled).toBe(true);
      });
    });

    it('should distribute weights equally when equal method is selected', () => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('equal');
      fixture.detectChanges();

      const firstWeight = component.conditionsFormArray.at(0).get('assignmentWeight')?.value;
      const secondWeight = component.conditionsFormArray.at(1).get('assignmentWeight')?.value;

      expect(firstWeight + secondWeight).toBe(100);
      expect(firstWeight).toBe(50);
      expect(secondWeight).toBe(50);
    });

    it('should disable weight inputs when equal method is selected', () => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('equal');
      fixture.detectChanges();

      component.conditionsFormArray.controls.forEach((control) => {
        expect(control.get('assignmentWeight')?.disabled).toBe(true);
      });
    });
  });

  describe('Weight Distribution', () => {
    it('should distribute weights equally with proper rounding for 3 conditions', async () => {
      const threeConditionsData = {
        ...mockDialogData,
        params: {
          experimentWeightsArray: [
            { id: '1', conditionCode: 'A', assignmentWeight: 0 },
            { id: '2', conditionCode: 'B', assignmentWeight: 0 },
            { id: '3', conditionCode: 'C', assignmentWeight: 0 },
          ],
        },
      };

      const { component } = await setupComponent(threeConditionsData);
      component.distributeWeightsEqually();

      const total = component.getCurrentTotal();
      expect(total).toBe(100);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('custom');
      fixture.detectChanges();
    });

    it('should validate that weights are required', () => {
      const weightControl = component.getWeightControl(0);
      weightControl.setValue('');
      weightControl.markAsTouched();

      expect(weightControl.hasError('required')).toBe(true);
    });

    it('should validate minimum weight value', () => {
      const weightControl = component.getWeightControl(0);
      weightControl.setValue(-1);

      expect(weightControl.hasError('min')).toBe(true);
    });

    it('should validate maximum weight value', () => {
      const weightControl = component.getWeightControl(0);
      weightControl.setValue(101);

      expect(weightControl.hasError('max')).toBe(true);
    });

    it('should validate decimal places', () => {
      const weightControl = component.getWeightControl(0);
      weightControl.setValue(25.123);

      expect(weightControl.hasError('tooManyDecimals')).toBe(true);
    });

    it('should validate total weight equals 100', () => {
      component.getWeightControl(0).setValue(60);
      component.getWeightControl(1).setValue(30);
      component.onWeightChange();

      expect(component.conditionsFormArray.hasError('totalWeightInvalid')).toBe(true);
    });

    it('should pass validation when total weight equals 100', () => {
      component.getWeightControl(0).setValue(60);
      component.getWeightControl(1).setValue(40);
      component.onWeightChange();

      expect(component.conditionsFormArray.hasError('totalWeightInvalid')).toBe(false);
    });

    it('should allow small rounding errors in total weight', () => {
      component.getWeightControl(0).setValue(33.33);
      component.getWeightControl(1).setValue(66.67);
      component.onWeightChange();

      expect(component.conditionsFormArray.hasError('totalWeightInvalid')).toBe(false);
    });
  });

  describe('Total Weight Status', () => {
    beforeEach(() => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('custom');
    });

    it('should return correct total weight status when valid', () => {
      component.getWeightControl(0).setValue(50);
      component.getWeightControl(1).setValue(50);

      const status = component.getTotalWeightStatus();
      expect(status.total).toBe(100);
      expect(status.isValid).toBe(true);
      expect(status.error).toBeUndefined();
    });

    it('should return correct total weight status when invalid', () => {
      component.getWeightControl(0).setValue(60);
      component.getWeightControl(1).setValue(30);

      const status = component.getTotalWeightStatus();
      expect(status.total).toBe(90);
      expect(status.isValid).toBe(false);
      expect(status.error).toContain('Total must equal 100%');
    });
  });

  describe('Primary Action Button', () => {
    it('should be disabled when form is invalid', (done) => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('custom');
      component.getWeightControl(0).setValue(60);
      component.getWeightControl(1).setValue(30); // Total = 90, invalid

      component.isPrimaryButtonDisabled$.subscribe((disabled) => {
        expect(disabled).toBe(true);
        done();
      });
    });

    it('should be enabled when form is valid', (done) => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('equal');

      component.isPrimaryButtonDisabled$.subscribe((disabled) => {
        expect(disabled).toBe(false);
        done();
      });
    });
  });

  describe('Modal Actions', () => {
    it('should close dialog with result when form is valid', () => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('equal');
      component.onPrimaryActionBtnClicked();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            conditionId: '1',
            conditionCode: 'Control',
            assignmentWeight: expect.any(Number),
          }),
          expect.objectContaining({
            conditionId: '2',
            conditionCode: 'Treatment',
            assignmentWeight: expect.any(Number),
          }),
        ])
      );
    });

    it('should not close dialog when form is invalid', () => {
      // Form is invalid because no weighting method is selected
      component.onPrimaryActionBtnClicked();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should close dialog without result when closeModal is called', () => {
      component.closeModal();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('Decimal Validator', () => {
    it('should return null for valid decimal', () => {
      const control = { value: '25.50' } as any;
      const result = component.decimalValidator(control);
      expect(result).toBeNull();
    });

    it('should return error for too many decimal places', () => {
      const control = { value: '25.123' } as any;
      const result = component.decimalValidator(control);
      expect(result).toEqual({ tooManyDecimals: true });
    });

    it('should return error for invalid number', () => {
      const control = { value: 'abc' } as any;
      const result = component.decimalValidator(control);
      expect(result).toEqual({ invalidNumber: true });
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as any;
      const result = component.decimalValidator(control);
      expect(result).toBeNull();
    });
  });

  describe('Weight Control Access', () => {
    it('should return correct weight control for given index', () => {
      const control = component.getWeightControl(0);
      expect(control).toBe(component.conditionsFormArray.at(0).get('assignmentWeight'));
    });
  });

  describe('Current Total Calculation', () => {
    it('should calculate current total correctly', () => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('custom');
      component.getWeightControl(0).setValue(30);
      component.getWeightControl(1).setValue(45);

      const total = component.getCurrentTotal();
      expect(total).toBe(75);
    });

    it('should handle invalid weight values in total calculation', () => {
      component.conditionWeightForm.get('weightingMethod')?.setValue('custom');
      component.getWeightControl(0).setValue('invalid');
      component.getWeightControl(1).setValue(50);

      const total = component.getCurrentTotal();
      expect(total).toBe(50);
    });
  });
});
