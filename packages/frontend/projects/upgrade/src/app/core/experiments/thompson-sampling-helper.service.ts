import { Injectable } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { ASSIGNMENT_ALGORITHM } from 'upgrade_types';
import {
  ExperimentVM,
  THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS,
  ThompsonSamplingConfigDTO,
} from './store/experiments.model';
import { BullettedListKeyValueFormat } from '@shared-component-lib/common-section-card-overview-details/common-section-card-overview-details.component';
import { CommonFormHelpersService } from '../../shared/services/common-form-helpers.service';

const DEFAULT_MAX_NUMBER_INPUT = 1000000;
const MIN_SCALING_FACTOR = 0.01;
const SCALING_FACTOR_DECIMAL_PLACES = 2;

export interface EditableThompsonSamplingConfig {
  scalingFactor: number;
  warmupThreshold: number;
  minimumDrawDifference: number;
  batchSize: number;
}

export function isThompsonSamplingExperiment(experiment: ExperimentVM): boolean {
  return experiment?.assignmentAlgorithm === ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING;
}

export function formatThompsonSamplingConfigDetails(
  experiment: ExperimentVM
): BullettedListKeyValueFormat[] | undefined {
  if (experiment?.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING) {
    return undefined;
  }

  const config = experiment.thompsonSamplingConfig;
  return [
    { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.SCALING_FACTOR, value: config?.scalingFactor ?? 1 },
    { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.WARMUP_THRESHOLD, value: config?.warmupThreshold },
    {
      labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.MINIMUM_DRAW_DIFFERENCE,
      value: config?.minimumDrawDifference?.toFixed(1),
    },
    { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.BATCH_SIZE, value: config?.batchSize },
  ];
}

@Injectable({
  providedIn: 'root',
})
export class ThompsonSamplingHelperService {
  isThompsonSamplingAlgorithm(algorithm: ASSIGNMENT_ALGORITHM): boolean {
    return algorithm === ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING;
  }

  isThompsonSamplingExperiment(experiment: ExperimentVM): boolean {
    return isThompsonSamplingExperiment(experiment);
  }

  getDefaults(): EditableThompsonSamplingConfig {
    return { scalingFactor: 1, warmupThreshold: 0, minimumDrawDifference: 0, batchSize: 1 };
  }

  deriveEditableParameters(existing?: ThompsonSamplingConfigDTO): EditableThompsonSamplingConfig {
    const defaults = this.getDefaults();
    return {
      scalingFactor: existing?.scalingFactor ?? defaults.scalingFactor,
      warmupThreshold: existing?.warmupThreshold ?? defaults.warmupThreshold,
      minimumDrawDifference: existing?.minimumDrawDifference ?? defaults.minimumDrawDifference,
      batchSize: existing?.batchSize ?? defaults.batchSize,
    };
  }

  buildConfig(editableParams: EditableThompsonSamplingConfig): ThompsonSamplingConfigDTO {
    return {
      scalingFactor: editableParams.scalingFactor,
      warmupThreshold: editableParams.warmupThreshold,
      minimumDrawDifference: editableParams.minimumDrawDifference,
      batchSize: editableParams.batchSize,
    };
  }

  getFieldValidators(): Record<string, ValidatorFn[]> {
    return {
      scalingFactor: [
        Validators.required,
        Validators.min(MIN_SCALING_FACTOR),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.maxDecimalPlacesValidator(SCALING_FACTOR_DECIMAL_PLACES),
      ],
      batchSize: [
        Validators.required,
        Validators.min(1),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
      warmupThreshold: [
        Validators.required,
        Validators.min(0),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
      minimumDrawDifference: [Validators.required, Validators.min(0), Validators.max(1.0)],
    };
  }

  getPriorFieldValidators(): Record<string, ValidatorFn[]> {
    const minValue = 1;
    return {
      successes: [
        Validators.required,
        Validators.min(minValue),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
      failures: [
        Validators.required,
        Validators.min(minValue),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
    };
  }
}
