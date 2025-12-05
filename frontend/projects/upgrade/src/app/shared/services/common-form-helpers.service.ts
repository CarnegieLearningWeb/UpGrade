import { Injectable } from '@angular/core';
import { FormGroup, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

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

  /**
   * Creates a validator function that checks if autocomplete value is an object (selected)
   * rather than a string (typed).
   *
   * Example usage:
   * ```typescript
   * const validator = CommonFormHelpersService.createAutocompleteSelectionValidator();
   * this.formGroup.get('field')?.setValidators([Validators.required, validator]);
   * ```
   *
   * @param checkFn Optional function to determine if value is a valid object. Defaults to checking for 'key' property.
   * @returns ValidatorFn that returns error if value is not a selected object
   */
  public static createAutocompleteSelectionValidator(checkFn?: (value: any) => boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; // Let required validator handle empty values
      }

      // Use custom check function if provided, otherwise check for object with 'key' property
      const isValidObject = checkFn
        ? checkFn(value)
        : typeof value === 'object' && value !== null && !Array.isArray(value) && 'key' in value;

      if (isValidObject) {
        return null;
      }

      // Invalid if it's a string (typed, not selected)
      return { mustSelectFromOptions: true };
    };
  }

  /**
   * Updates validators for multiple form fields based on a configuration map.
   * Useful for dynamically updating validators based on form state.
   *
   * Example usage:
   * ```typescript
   * const validatorConfig = {
   *   field1: [Validators.required],
   *   field2: [Validators.required, Validators.email],
   *   field3: null // Clear validators
   * };
   * CommonFormHelpersService.updateValidatorsFromConfig(myForm, validatorConfig);
   * ```
   *
   * @param form The FormGroup instance to operate on.
   * @param config Map of field names to validator arrays (null to clear validators).
   * @param emitEvent Whether to emit valueChanges events. Defaults to false.
   */
  public static updateValidatorsFromConfig(
    form: FormGroup,
    config: { [key: string]: ValidatorFn[] | null },
    emitEvent = false
  ): void {
    Object.entries(config).forEach(([fieldName, validators]) => {
      const control = form.get(fieldName);
      if (control) {
        if (validators === null) {
          control.clearValidators();
        } else {
          control.setValidators(validators);
        }
        control.updateValueAndValidity({ emitEvent });
      }
    });

    // Update the form's overall validity status
    if (emitEvent) {
      form.updateValueAndValidity({ emitEvent: true });
    }
  }
}
