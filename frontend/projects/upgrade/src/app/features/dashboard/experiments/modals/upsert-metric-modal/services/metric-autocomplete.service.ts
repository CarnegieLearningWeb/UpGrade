import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import {
  MetricOption,
  MetricFormControlValue,
  isMetricOption,
} from '../../../../../../core/experiments/store/experiments.model';

/**
 * Configuration for an autocomplete field
 */
export interface AutocompleteFieldConfig {
  formGroup: FormGroup;
  controlName: string;
}

/**
 * Represents a managed autocomplete field with its state and observables
 */
export interface AutocompleteField {
  // Options available for this field
  options$: BehaviorSubject<MetricOption[]>;

  // Filtered options based on user input
  filteredOptions$: Observable<MetricOption[]>;

  // Whether the user has selected a valid option (not just typing)
  hasValidSelection$: BehaviorSubject<boolean>;

  // Clear this field and any dependent fields
  clear: () => void;

  // Set options for this field
  setOptions: (options: MetricOption[]) => void;

  // Mark as having a valid selection
  markAsValid: () => void;

  // Mark as invalid (user is typing, not selecting)
  markAsInvalid: () => void;

  // Get current options
  getOptions: () => MetricOption[];

  // Check if has valid selection
  hasValidSelection: () => boolean;
}

/**
 * Service to manage autocomplete fields with hierarchical dependencies.
 * Eliminates duplication of autocomplete logic across multiple fields.
 */
@Injectable({
  providedIn: 'root',
})
export class MetricAutocompleteService {
  /**
   * Create a managed autocomplete field
   */
  createField(config: AutocompleteFieldConfig): AutocompleteField {
    const { formGroup, controlName } = config;
    const control = formGroup.get(controlName) as FormControl;

    if (!control) {
      throw new Error(`Form control "${controlName}" not found in form group`);
    }

    // State management
    const options$ = new BehaviorSubject<MetricOption[]>([]);
    const hasValidSelection$ = new BehaviorSubject<boolean>(false);

    // Create filtered observable
    const filteredOptions$ = combineLatest([control.valueChanges.pipe(startWith('')), options$]).pipe(
      map(([searchValue, options]) => this.filterOptions(searchValue || '', options))
    );

    return {
      options$,
      filteredOptions$,
      hasValidSelection$,

      clear: () => {
        control.setValue('');
        hasValidSelection$.next(false);
        options$.next([]);
      },

      setOptions: (options: MetricOption[]) => {
        options$.next(options);
      },

      markAsValid: () => {
        hasValidSelection$.next(true);
      },

      markAsInvalid: () => {
        hasValidSelection$.next(false);
      },

      getOptions: () => options$.getValue(),

      hasValidSelection: () => hasValidSelection$.getValue(),
    };
  }

  /**
   * Setup a hierarchical dependency where selecting a parent option
   * populates the child field with the parent's children.
   *
   * @param parent The parent autocomplete field
   * @param child The child autocomplete field (will be populated with parent's children)
   * @param formGroup The form group containing both controls
   * @param parentControlName Name of the parent control
   * @param childControlName Name of the child control
   * @param getChildOptions Optional function to transform parent selection into child options
   */
  setupHierarchy(
    parent: AutocompleteField,
    child: AutocompleteField,
    formGroup: FormGroup,
    parentControlName: string,
    childControlName: string
  ): void {
    const parentControl = formGroup.get(parentControlName);
    const childControl = formGroup.get(childControlName);

    if (!parentControl || !childControl) {
      throw new Error('Parent or child control not found');
    }

    // When parent value changes (user typing)
    parentControl.valueChanges.subscribe((value: MetricFormControlValue) => {
      // If user is typing (string) after selecting an option, invalidate parent
      if (!isMetricOption(value) && parent.hasValidSelection()) {
        parent.markAsInvalid();
        child.clear();
      }

      // If parent field is cleared completely
      if (!value) {
        parent.markAsInvalid();
        child.clear();
      }
    });
  }

  /**
   * Handle selection of an autocomplete option
   *
   * @param field The autocomplete field
   * @param value The selected value
   * @param childFields Optional array of child fields to clear when parent is selected
   * @returns The children of the selected option, if any
   */
  onOptionSelected(
    field: AutocompleteField,
    value: MetricFormControlValue,
    childFields?: AutocompleteField[]
  ): MetricOption[] {
    if (!isMetricOption(value)) {
      return [];
    }

    field.markAsValid();

    // Clear any child fields
    if (childFields) {
      childFields.forEach((child) => child.clear());
    }

    // Return children for population
    return this.getChildrenFromOption(value);
  }

  /**
   * Handle when user types in an autocomplete field (value change)
   *
   * @param field The autocomplete field
   * @param value The current value
   * @param childFields Optional array of child fields to clear if value becomes invalid
   */
  onValueChange(field: AutocompleteField, value: MetricFormControlValue, childFields?: AutocompleteField[]): void {
    // If user is typing (string value) after selecting an option, invalidate
    if (!isMetricOption(value) && field.hasValidSelection()) {
      field.markAsInvalid();

      // Clear dependent child fields
      if (childFields) {
        childFields.forEach((child) => child.clear());
      }
    }

    // If field is cleared completely
    if (!value) {
      field.markAsInvalid();

      // Clear dependent child fields
      if (childFields) {
        childFields.forEach((child) => child.clear());
      }
    }
  }

  /**
   * Get children from a metric option, handling various structures
   */
  getChildrenFromOption(option: MetricFormControlValue): MetricOption[] {
    if (!isMetricOption(option)) {
      return [];
    }

    // If option has children, return them
    if (option.children && option.children.length > 0) {
      return Array.isArray(option.children) ? option.children : [];
    }

    // If no children, return the option itself wrapped in array (for leaf nodes)
    return [option];
  }

  /**
   * Display function for autocomplete mat-options
   */
  displayFn = (option?: MetricFormControlValue): string => {
    return isMetricOption(option) ? option.key : option || '';
  };

  /**
   * Extract the key string from a MetricFormControlValue
   */
  extractKey(value: MetricFormControlValue): string {
    return isMetricOption(value) ? value.key : value || '';
  }

  /**
   * Filter options based on search value
   */
  filterOptions(value: MetricFormControlValue, options: MetricOption[]): MetricOption[] {
    const filterValue = this.extractKey(value).toLowerCase();
    return options.filter((option) => option.key.toLowerCase().includes(filterValue));
  }

  /**
   * Find an option by its key
   */
  findOptionByKey(options: MetricOption[], key: string): MetricOption | undefined {
    if (!options.length || !key) {
      return undefined;
    }
    return options.find((option) => option?.key === key);
  }

  /**
   * Resolve a form control value to a MetricOption
   * If value is already a MetricOption, return it
   * If value is a string, find it in the provided options
   */
  resolveOption(controlValue: MetricFormControlValue, options: MetricOption[] = []): MetricOption | undefined {
    if (!controlValue) {
      return undefined;
    }
    if (isMetricOption(controlValue)) {
      return controlValue;
    }
    return this.findOptionByKey(options, this.extractKey(controlValue));
  }
}
