import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { CommonTagInputType } from '../../../core/feature-flags/store/feature-flags.model';

// This Component is made to manage a list of tags using mat-chips.
// It uses ControlValueAccessor which implements methods to synchronize the component's value with the parent form control.
// writeValue(value: string[]): Sets the component's value.
// registerOnChange(fn: any): Registers a callback for when the value changes.
// registerOnTouched(fn: any): Registers a callback for when the component is touched.

// Typical usage
//   <app-common-tags-input formControlName="tags"></app-common-tags-input>

// To add Import/Export button while using component
// you can add the property 'actionButtons' which will check for
// tags value and will display Import/Export icon accordingly
// and bind it with 'actionButtonClicked' to implement action

// Manage built-in optional action buttons
// <app-common-tags-input
//         [actionButtons]="true"
//         (actionButtonClicked)="actionButton()"
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
export class CommonTagsInputComponent implements ControlValueAccessor, OnInit {
  @Input() inputType: CommonTagInputType = CommonTagInputType.TAGS;
  @Input() actionButtons = false;
  @Output() actionButtonClicked = new EventEmitter<void>();

  showExportIcon = false;
  showImportIcon = false;
  isChipSelectable = false;
  isChipRemovable = true;
  addChipOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  tags = new FormControl<string[]>([]);

  ngOnInit(): void {
    this.checkTagValue();
  }

  checkTagValue(): void {
    this.tags.valueChanges.subscribe((value) => {
      if (this.actionButtons) {
        // Update showExportIcon and showImportIcon based on tags value
        if (value && value.length > 0) {
          this.showExportIcon = true;
          this.showImportIcon = false;
        } else {
          this.showImportIcon = true;
          this.showExportIcon = false;
        }
      }
    });
  }

  onActionButtonClick(event: MouseEvent): void {
    event.preventDefault();

    if (this.showImportIcon) {
      console.log('Import values from CSV!');
    } else if (this.showExportIcon) {
      console.log('Export values to CSV!');
    }
    this.actionButtonClicked.emit();
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

    this.checkTagValue();
  }

  removeChip(tag: string) {
    const currentTags = this.tags.value || [];
    const newTags = currentTags.filter((t) => t !== tag);

    this.tags.setValue(newTags);
    this.tags.updateValueAndValidity();

    this.checkTagValue();
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
