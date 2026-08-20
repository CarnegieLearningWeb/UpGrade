import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModalComponent } from '@shared-component-lib';
import { containsListValueSeparator } from '../../../../../core/segments/list-values.utils';

export interface EditListValueModalData {
  value: string;
  existingValues: string[];
}

@Component({
  selector: 'app-edit-list-value-modal',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, CommonModalComponent],
  templateUrl: './edit-list-value-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditListValueModalComponent {
  valueControl = new FormControl(this.data.value, {
    nonNullable: true,
    validators: [Validators.required, this.uniqueValueValidator.bind(this)],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditListValueModalData,
    private dialogRef: MatDialogRef<EditListValueModalComponent, string>
  ) {}

  private uniqueValueValidator(control: FormControl<string>) {
    const value = control.value.trim();
    if (!value) {
      return { required: true };
    }
    // The add/import pipelines split on these characters, so a value containing them
    // could not round-trip through paste or CSV export/import.
    if (containsListValueSeparator(value)) {
      return { separator: true };
    }
    return value !== this.data.value && this.data.existingValues.includes(value) ? { duplicate: true } : null;
  }

  submit(): void {
    if (this.valueControl.invalid) {
      this.valueControl.markAsTouched();
      return;
    }
    this.dialogRef.close(this.valueControl.value.trim());
  }
}
