import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {
  NewFlagDialogData,
  FeatureFlag,
  NewFlagDialogEvents,
  NewFlagPaths,
  VariationTypes,
} from '../../../../../core/feature-flags/store/feature-flags.model';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'feature-flag-variations',
  templateUrl: './flag-variations.component.html',
  styleUrls: ['./flag-variations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagVariationsComponent implements OnChanges {
  @Input() flagInfo: FeatureFlag;
  @Input() variationType: string;
  @Output() emitFlagDialogEvent = new EventEmitter<NewFlagDialogData>();
  @ViewChild('variationTable', { read: ElementRef }) variationTable: ElementRef;

  flagVariationsForm: FormGroup;
  variationsDataSource = new BehaviorSubject<AbstractControl[]>([]);
  variationError: string;

  variationDisplayedColumns = ['variationNumber', 'value', 'name', 'description', 'removeVariation'];
  constructor(private _formBuilder: FormBuilder, private featureFlagService: FeatureFlagsService) {}

  ngOnChanges(changes: SimpleChanges) {
    this.variationError = '';
    this.flagVariationsForm = this._formBuilder.group({
      variations: this._formBuilder.array([]),
      defaultOnVariation: [null, Validators.required],
      defaultOffVariation: [null, Validators.required],
    });

    if (this.flagInfo) {
      if (this.variationType === this.flagInfo.variationType) {
        this.flagInfo.variations.forEach((variation) => {
          this.variation.push(this.addVariations(variation.value, variation.name, variation.description));
        });
        this.flagVariationsForm.patchValue({
          defaultOnVariation: this.featureFlagService.getActiveVariation(this.flagInfo, true),
          defaultOffVariation: this.featureFlagService.getActiveVariation(this.flagInfo, false),
        });
      } else {
        this.setVariationFormControl();
      }
    }

    if (changes.variationType && this.variationType && !this.flagInfo) {
      this.setVariationFormControl();
    }
    this.updateView();
    this.flagVariationsForm.get('variations').valueChanges.subscribe(() => {
      this.flagVariationsForm.patchValue({
        defaultOnVariation: null,
        defaultOffVariation: null,
      });
    });
  }

  addVariations(value = null, name = null, description = null) {
    return this._formBuilder.group({
      value: [{ value, disabled: this.variationType === VariationTypes.BOOLEAN }, Validators.required],
      name: [name],
      description: [description],
    });
  }

  addVariation() {
    this.variation.push(this.addVariations());
    this.updateView();
  }

  removeVariation(groupIndex: number) {
    this.variation.removeAt(groupIndex);
    this.updateView();
  }

  setVariationFormControl() {
    if (this.variationType === VariationTypes.BOOLEAN) {
      this.variation.push(this.addVariations('true'));
      this.variation.push(this.addVariations('false'));
    } else if (this.variationType === VariationTypes.CUSTOM) {
      this.variation.push(this.addVariations());
    }
  }

  updateView() {
    this.variationsDataSource.next(this.variation.controls);
    if (this.variationTable) {
      this.variationTable.nativeElement.scroll({
        top: this.variationTable.nativeElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  validationVariationFormData() {
    const { variations } = this.flagVariationsForm.getRawValue();
    const names = variations.map((variation) => variation.name).filter((name) => !!name);
    const values = variations.map((variation) => variation.value);
    if (names.length !== new Set(names).size) {
      this.variationError = 'All variation names must be unique';
    } else if (values.length !== new Set(values).size) {
      this.variationError = 'All variation values must be unique';
    } else {
      this.variationError = '';
    }
  }

  emitEvent(eventType: NewFlagDialogEvents) {
    switch (eventType) {
      case NewFlagDialogEvents.CLOSE_DIALOG:
        this.emitFlagDialogEvent.emit({ type: eventType });
        break;
      case NewFlagDialogEvents.SEND_FORM_DATA:
        this.validationVariationFormData();
        if (this.flagVariationsForm.valid && !this.variationError) {
          const { defaultOnVariation, defaultOffVariation, ...flagVariationsFormData } =
            this.flagVariationsForm.getRawValue();
          flagVariationsFormData.variations = flagVariationsFormData.variations.map((variation, index) => {
            // TODO: Find a better logic
            if (variation.value === defaultOnVariation && variation.value === defaultOffVariation) {
              variation.defaultVariation = [true, false];
            } else if (variation.value === defaultOnVariation) {
              variation.defaultVariation = [true];
            } else if (variation.value === defaultOffVariation) {
              variation.defaultVariation = [false];
            } else {
              variation.defaultVariation = null;
            }
            return this.flagInfo
              ? { ...this.flagInfo.variations[index], ...variation }
              : { id: uuidv4(), ...variation };
          });
          this.emitFlagDialogEvent.emit({
            type: this.flagInfo ? NewFlagDialogEvents.UPDATE_FLAG : eventType,
            formData: flagVariationsFormData,
            path: NewFlagPaths.FLAG_VARIATIONS,
          });
        }
        break;
    }
  }

  getVariationValues() {
    if (this.variationType === VariationTypes.BOOLEAN) {
      return ['true', 'false'];
    }
    return this.variation.value.map((variation) => variation.value).filter((val) => !!val);
  }

  get variation(): FormArray {
    return this.flagVariationsForm.get('variations') as FormArray;
  }

  get NewFlagDialogEvents() {
    return NewFlagDialogEvents;
  }

  get variationTypes() {
    return VariationTypes;
  }
}
