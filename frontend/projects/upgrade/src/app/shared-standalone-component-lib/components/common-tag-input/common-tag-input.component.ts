import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

// This Component is made to manage a list of tags using mat-chips.
// It uses ControlValueAccessor which implements methods to synchronize the component's value with the parent form control.
// writeValue(value: string[]): Sets the component's value.
// registerOnChange(fn: any): Registers a callback for when the value changes.
// registerOnTouched(fn: any): Registers a callback for when the component is touched.

// Example Usage:
//   <app-common-tags-input formControlName="tags"></app-common-tags-input>

// To add Import/Export button while using component
// you can add the property 'showUploadIcon' or 'showDownloadIcon'
// with its repective binding 'uploadClicked' or 'downloadClicked'

//Example Usage for Export Button
// <app-common-tags-input
//         [showExportIcon]="true"
//         (exportClicked)="onExportClick()"
//         formControlName="tags"
//       ></app-common-tags-input>

@Component({
  selector: 'app-common-tags-input',
  templateUrl: './common-tag-input.component.html',
  styleUrls: ['./common-tag-input.component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonTagsInputComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, TranslateModule],
})
export class CommonTagsInputComponent implements ControlValueAccessor {
  @Input() showExportIcon = false;
  @Output() exportClicked = new EventEmitter<void>();
  @Input() showImportIcon = false;
  @Output() importClicked = new EventEmitter<void>();

  isChipSelectable = true;
  isChipRemovable = true;
  addChipOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  tags = new FormControl<string[]>([]);

  onExportClick(): void {
    this.exportClicked.emit();
  }

  onImportClick(): void {
    this.importClicked.emit();
  }

  addChip(event: MatChipInputEvent) {
    const input = event.chipInput;
    const value = (event.value || '').trim().toLowerCase();

    // Add chip
    if (value) {
      const currentTags = this.tags.value || [];
      if (!currentTags.includes(value)) {
        this.tags.setValue([...currentTags, value]);
        this.tags.updateValueAndValidity();
      }
    }

    // Reset the input value
    if (input) {
      input.clear();
    }
  }

  removeChip(tag: string) {
    const currentTags = this.tags.value || [];
    const newTags = currentTags.filter((t) => t !== tag);

    this.tags.setValue(newTags);
    this.tags.updateValueAndValidity();
  }
  // Implement ControlValueAccessor methods
  writeValue(value: string[]) {
    this.tags.setValue(value || []);
  }

  registerOnChange(fn: any) {
    this.tags.valueChanges.subscribe(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerOnTouched(fn: any) {}
}
