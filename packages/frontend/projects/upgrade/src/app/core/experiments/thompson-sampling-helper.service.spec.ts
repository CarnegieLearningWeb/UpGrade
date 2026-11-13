import { FormControl } from '@angular/forms';
import { ASSIGNMENT_ALGORITHM } from 'upgrade_types';
import { formatThompsonSamplingConfigDetails, ThompsonSamplingHelperService } from './thompson-sampling-helper.service';
import { ExperimentVM, THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS } from './store/experiments.model';

describe('ThompsonSamplingHelperService', () => {
  let service: ThompsonSamplingHelperService;

  beforeEach(() => {
    service = new ThompsonSamplingHelperService();
  });

  describe('scalingFactor', () => {
    it('defaults to 1 (no scaling)', () => {
      expect(service.getDefaults().scalingFactor).toBe(1);
      expect(service.deriveEditableParameters(undefined).scalingFactor).toBe(1);
    });

    it('carries an existing value through derive and build', () => {
      const editable = service.deriveEditableParameters({ scalingFactor: 0.2 });
      expect(editable.scalingFactor).toBe(0.2);
      expect(service.buildConfig(editable).scalingFactor).toBe(0.2);
    });

    function errorsFor(value: unknown): string[] {
      const control = new FormControl(value, service.getFieldValidators().scalingFactor);
      return Object.keys(control.errors ?? {});
    }

    it.each([0.01, 0.2, 1, 2.5, 10000, 1000000])('accepts %p', (value) => {
      expect(errorsFor(value)).toEqual([]);
    });

    it('rejects values below 0.01 or above 1,000,000', () => {
      expect(errorsFor(0)).toContain('min');
      expect(errorsFor(-1)).toContain('min');
      expect(errorsFor(1000000.01)).toContain('max');
    });

    it('rejects more than two decimal places', () => {
      expect(errorsFor(0.125)).toContain('maxDecimalPlaces');
    });

    it('is required', () => {
      expect(errorsFor(null)).toContain('required');
    });
  });

  describe('formatThompsonSamplingConfigDetails', () => {
    it('lists scaling factor first and batch size last', () => {
      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        thompsonSamplingConfig: { scalingFactor: 0.5, warmupThreshold: 10, minimumDrawDifference: 0.1, batchSize: 5 },
      } as ExperimentVM;

      expect(formatThompsonSamplingConfigDetails(experiment)).toEqual([
        { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.SCALING_FACTOR, value: 0.5 },
        { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.WARMUP_THRESHOLD, value: 10 },
        { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.MINIMUM_DRAW_DIFFERENCE, value: '0.1' },
        { labelKey: THOMPSON_SAMPLING_OVERVIEW_PARAM_LABELS.BATCH_SIZE, value: 5 },
      ]);
    });

    it('shows a scaling factor of 1 for a config saved before the field existed', () => {
      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        thompsonSamplingConfig: { warmupThreshold: 0, minimumDrawDifference: 0, batchSize: 1 },
      } as ExperimentVM;

      expect(formatThompsonSamplingConfigDetails(experiment)?.[0].value).toBe(1);
    });
  });
});
