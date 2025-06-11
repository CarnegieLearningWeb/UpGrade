import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * TrimInputDirective automatically trims leading and trailing whitespace
 * from form control values when the user finishes editing (on blur).
 *
 * Usage:
 * <input matInput formControlName="fieldName" appTrimInput placeholder="Enter value">
 *
 * This directive will:
 * - Trim whitespace on blur (when user finishes editing)
 * - Update both the DOM element and the form control
 * - Work with any input that has a form control
 */
@Directive({
  selector: '[appTrimInput]',
  standalone: false,
})
export class TrimInputDirective {
  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('blur') onBlur() {
    const value = this.el.nativeElement.value;
    if (value != null && typeof value === 'string') {
      const trimmedValue = value.trim();

      // Only update if the value actually changed after trimming
      if (trimmedValue !== value) {
        this.el.nativeElement.value = trimmedValue;
        if (this.control?.control) {
          this.control.control.setValue(trimmedValue, { emitEvent: false });
        }
      }
    }
  }
}
