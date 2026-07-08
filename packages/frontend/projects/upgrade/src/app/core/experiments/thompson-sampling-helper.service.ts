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

export interface EditableThompsonSamplingConfig {
  batchSize: number;
  warmupThreshold: number;
  minimumDrawDifference: number;
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
    { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.BATCH_SIZE, value: config?.batchSize },
    { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.WARMUP_THRESHOLD, value: config?.warmupThreshold },
    {
      labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.MINIMUM_DRAW_DIFFERENCE,
      value: config?.minimumDrawDifference,
    },
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
    return { batchSize: 1, warmupThreshold: 0, minimumDrawDifference: 0 };
  }

  deriveEditableParameters(existing?: ThompsonSamplingConfigDTO): EditableThompsonSamplingConfig {
    const defaults = this.getDefaults();
    return {
      batchSize: existing?.batchSize ?? defaults.batchSize,
      warmupThreshold: existing?.warmupThreshold ?? defaults.warmupThreshold,
      minimumDrawDifference: existing?.minimumDrawDifference ?? defaults.minimumDrawDifference,
    };
  }

  buildConfig(editableParams: EditableThompsonSamplingConfig): ThompsonSamplingConfigDTO {
    return {
      batchSize: editableParams.batchSize,
      warmupThreshold: editableParams.warmupThreshold,
      minimumDrawDifference: editableParams.minimumDrawDifference,
    };
  }

  getFieldValidators(): Record<string, ValidatorFn[]> {
    return {
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
