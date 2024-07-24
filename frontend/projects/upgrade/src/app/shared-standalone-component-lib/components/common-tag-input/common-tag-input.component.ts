import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl, ControlContainer, FormGroup } from '@angular/forms';
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
  showExportIcon = false;
  showImportIcon = false;
  @Input() actionButtons = false;
  @Input() formControlName = '';
  @Output() actionButtonClicked = new EventEmitter<void>();

  isChipSelectable = false;
  isChipRemovable = true;
  addChipOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  tags = new FormControl<string[]>([]);

  constructor(private controlContainer: ControlContainer) {}

  ngOnInit(): void {
    // Ensure the formControlName is provided and the parent form group is accessible
    if (this.formControlName && this.controlContainer && this.controlContainer.control) {
      const formGroup = this.controlContainer.control as FormGroup;
      // Access the form control using the provided name
      const formControl = formGroup.get(this.formControlName) as FormControl;
      if (formControl) {
        this.tags = formControl;
        this.checkTagValue();
      } else {
        console.warn(`FormControl with name '${this.formControlName}' not found in parent FormGroup`);
      }
    } else {
      console.warn('ControlName or parent FormGroup is not available');
    }
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

  onActionButtonClick(): void {
    this.actionButtonClicked.emit();
  }

  addChip(event: MatChipInputEvent) {
    const input = event.chipInput;
    const value = (event.value || '').trim().toLowerCase();

    // Add chip
    if (value) {
      const currentTags = this.tags.value || [];
      if (!currentTags.includes(value)) {
        this.tags.setValue([...currentTags, value], { emitEvent: false });
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

    this.tags.setValue(newTags, { emitEvent: false });
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
