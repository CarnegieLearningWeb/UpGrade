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
import { CommonImportContainerComponent } from '../common-import-container/common-import-container.component';
import { BehaviorSubject, from, mergeMap, Observable, reduce } from 'rxjs';

// This Component is made to manage a list of tags using mat-chips.
// It uses ControlValueAccessor which implements methods to synchronize the component's value with the parent form control.
// writeValue(value: string[]): Sets the component's value.
// registerOnChange(fn: any): Registers a callback for when the value changes.
// registerOnTouched(fn: any): Registers a callback for when the component is touched.

// Typical usage
// <app-common-tags-input
//   formControlName="tags"
//   [inputType]="CommonTagInputType.TAGS"
// ></app-common-tags-input>

// <app-common-tags-input
//   formControlName="values"
//   [inputType]="CommonTagInputType.VALUES"
//   [forceValidation]="forceValidation"
//   (downloadRequested)="onDownloadRequested($event)"
// ></app-common-tags-input>

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
  imports: [
    CommonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    CommonImportContainerComponent,
  ],
})
export class CommonTagsInputComponent implements ControlValueAccessor, OnInit {
  @Input() inputType: CommonTagInputType = CommonTagInputType.TAGS;
  @Input() forceValidation = false;
  @Output() downloadRequested = new EventEmitter<string[]>();

  tagsExist = false;
  isTouched = false;
  isFocused = false;
  showImportHelper = false;
  private importFailedSubject = new BehaviorSubject<boolean>(false);
  importFailed$ = this.importFailedSubject.asObservable();
  isChipSelectable = false;
  isChipRemovable = true;
  addChipOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  tags = new FormControl<string[]>([]);
  CommonTagInputType = CommonTagInputType;

  ngOnInit(): void {
    this.tags.valueChanges.subscribe((value) => {
      this.tagsExist = value && value.length > 0;
    });
  }

  onFocus() {
    this.isFocused = true;
    this.isTouched = true;
    this.onTouched();
  }

  onBlur() {
    this.isFocused = false;
    this.onTouched();
  }

  isInvalid(): boolean {
    if (this.inputType !== CommonTagInputType.VALUES) {
      return false;
    }

    return (
      (this.isTouched || this.forceValidation) && !this.isFocused && (!this.tags.value || this.tags.value.length === 0)
    );
  }

  onActionButtonClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.tagsExist) {
      this.downloadRequested.emit(this.tags.value || []);
    } else {
      this.importFailedSubject.next(false);
      this.showImportHelper = true;
    }
  }

  onCloseButtonClick(event: MouseEvent): void {
    event.preventDefault();
    this.showImportHelper = false;
  }

  handleFilesSelected(files: File[]) {
    from(files)
      .pipe(
        mergeMap((file) => this.readAndParseFile(file)),
        reduce<{ success: boolean; ids: string[] }, { ids: string[]; allValid: boolean }>(
          (acc, result) => {
            if (result.success) {
              return {
                ids: [...new Set([...acc.ids, ...result.ids])],
                allValid: acc.allValid,
              };
            } else {
              return { ids: acc.ids, allValid: false };
            }
          },
          { ids: [], allValid: true }
        )
      )
      .subscribe({
        next: (result) => {
          if (result.allValid && result.ids.length > 0) {
            this.tags.setValue(result.ids);
            this.tags.updateValueAndValidity();
            this.tagsExist = true;
            this.showImportHelper = false;
            this.importFailedSubject.next(false);
          } else {
            // No valid IDs found in any file
            this.importFailedSubject.next(true);
          }
        },
        error: () => {
          // Unexpected error during file reading or parsing
          this.importFailedSubject.next(true);
        },
      });
  }

  private readAndParseFile = (file: File): Observable<{ success: boolean; ids: string[] }> => {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const content = reader.result as string;
          const ids = this.parseCSVContent(content);
          observer.next({ success: true, ids });
        } catch (error) {
          // Invalid file content (empty or multiple columns)
          observer.next({ success: false, ids: [] });
        }
        observer.complete();
      };
      reader.onerror = () => {
        // Error reading file
        observer.next({ success: false, ids: [] });
        observer.complete();
      };
      reader.readAsText(file);
    });
  };

  private parseCSVContent(content: string): string[] {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) throw new Error('CSV file is empty');
    if (lines.some((line) => line.includes(','))) throw new Error('CSV should contain only one column');
    return lines;
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

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched = () => {};
}
