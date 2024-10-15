import { Injectable } from '@angular/core';
import { FormGroup, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class CommonFormHelpersService {
  /**
   * Marks all form controls as touched to display validation errors.
   *
   * Example usage:
   * ```typescript
   * CommonFormHelpersService.triggerTouchedToDisplayErrors(myForm);
   * ```
   *
   * @param form The FormGroup instance to operate on.
   */
  public static triggerTouchedToDisplayErrors(form: FormGroup) {
    Object.keys(form.controls).forEach((field) => {
      const control = form.get(field);
      control.markAsTouched({ onlySelf: true });
    });
  }

  /**
   * Clears validators for specified form fields.
   *
   * Example usage:
   * ```typescript
   * CommonFormHelpersService.clearValidatorsByFormField(myForm, ['email']);
   * ```
   *
   * @param form The FormGroup instance to operate on.
   * @param fieldsToClear An array of form field names whose validators should be cleared.
   */
  public static clearValidatorsByFormField(form: FormGroup, fieldsToClear: string[]): void {
    fieldsToClear.forEach((field) => {
      const control = form.get(field);
      control?.setValidators(null);
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Sets validators for a specific form field.
   *
   * Example usage:
   * ```typescript
   * CommonFormHelpersService.setFieldValidators(myForm, 'name', [Validators.required]);
   * ```
   *
   * @param form The FormGroup instance to operate on.
   * @param fieldName The name of the form field to set validators for.
   * @param validators An array of validators to apply to the field.
   */
  public static setFieldValidators(form: FormGroup, fieldName: string, validators: ValidatorFn[]): void {
    const control = form.get(fieldName);
    control?.setValidators(validators);
    control?.updateValueAndValidity({ emitEvent: false });
  }
}
