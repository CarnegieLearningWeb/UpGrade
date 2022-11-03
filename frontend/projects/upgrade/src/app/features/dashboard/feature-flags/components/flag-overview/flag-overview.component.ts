import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import {
  FeatureFlag,
  NewFlagDialogEvents,
  NewFlagDialogData,
  NewFlagPaths,
  VariationTypes,
} from '../../../../../core/feature-flags/store/feature-flags.model';
import { Subscription } from 'rxjs';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'feature-flag-overview',
  templateUrl: './flag-overview.component.html',
  styleUrls: ['./flag-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagOverviewComponent implements OnInit, OnDestroy {
  @Input() flagInfo: FeatureFlag;
  @Output() emitFlagDialogEvent = new EventEmitter<NewFlagDialogData>();
  overviewForm: FormGroup;
  variationTypes: string[] = [VariationTypes.BOOLEAN, VariationTypes.CUSTOM];
  allFlagsKeys: string[];
  allFlagsKeysSub: Subscription;
  keyError: string;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private _formBuilder: FormBuilder, private featureFlagsService: FeatureFlagsService) {}

  ngOnInit() {
    this.allFlagsKeysSub = this.featureFlagsService.allFlagsKeys$.subscribe((keys) => {
      this.allFlagsKeys = keys;
      if (this.flagInfo) {
        this.allFlagsKeys.splice(this.allFlagsKeys.indexOf(this.flagInfo.key), 1);
      }
    });

    this.overviewForm = this._formBuilder.group({
      name: [null, Validators.required],
      key: [null, Validators.required],
      description: [null],
      variationType: [null, Validators.required],
    });

    this.overviewForm.get('name').valueChanges.subscribe((name) => {
      this.overviewForm.get('key').setValue(name.split(' ').join('-'));
    });

    // populate values in form to update experiment if experiment data is available
    if (this.flagInfo) {
      this.overviewForm.setValue({
        name: this.flagInfo.name,
        key: this.flagInfo.key,
        description: this.flagInfo.description,
        variationType: this.flagInfo.variationType,
      });
    }
  }

  validateFormData(key: string): boolean {
    return !this.allFlagsKeys.includes(key);
  }

  emitEvent(eventType: NewFlagDialogEvents) {
    this.keyError = '';
    switch (eventType) {
      case NewFlagDialogEvents.CLOSE_DIALOG:
        this.emitFlagDialogEvent.emit({ type: eventType });
        break;
      case NewFlagDialogEvents.SEND_FORM_DATA:
        if (this.overviewForm.valid) {
          const { name, key, description, variationType } = this.overviewForm.value;
          if (this.validateFormData(key)) {
            const overviewFormData = {
              name,
              key,
              description: description || '',
              variationType,
            };
            this.emitFlagDialogEvent.emit({
              type: eventType,
              formData: overviewFormData,
              path: NewFlagPaths.FLAG_OVERVIEW,
            });
          } else {
            this.keyError = 'Duplicate flag key found';
          }
        }
        break;
    }
  }

  get NewFlagDialogEvents() {
    return NewFlagDialogEvents;
  }

  ngOnDestroy() {
    this.allFlagsKeysSub.unsubscribe();
  }
}
