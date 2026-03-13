import { Validators } from '@angular/forms';
import {
  MoocletExperimentHelperService,
  EditableTSConfigurablePolicyParameters,
  formatTSConfigurablePolicyParamDetails,
} from './mooclet-helper.service';
import { ASSIGNMENT_ALGORITHM, MoocletTSConfigurablePolicyParametersDTO } from 'upgrade_types';
import { ExperimentVM } from './store/experiments.model';
import { environment } from '../../../environments/environment';

describe('MoocletAlgorithmHelperService', () => {
  let service: MoocletExperimentHelperService;

  beforeEach(() => {
    service = new MoocletExperimentHelperService();
  });

  // ============================================================================
  // Environment and Feature Flag Methods
  // ============================================================================

  describe('isMoocletEnabled', () => {
    it('should return true when mooclet toggle is enabled', () => {
      environment.moocletToggle = true;
      expect(service.isMoocletEnabled()).toBe(true);
    });

    it('should return false when mooclet toggle is disabled', () => {
      environment.moocletToggle = false;
      expect(service.isMoocletEnabled()).toBe(false);
    });
  });

  describe('isMoocletAlgorithm', () => {
    it('should return true for TS_CONFIGURABLE algorithm', () => {
      expect(service.isMoocletAlgorithm(ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE)).toBe(true);
    });

    it('should return false for RANDOM algorithm', () => {
      expect(service.isMoocletAlgorithm(ASSIGNMENT_ALGORITHM.RANDOM)).toBe(false);
    });

    it('should return false for STRATIFIED_RANDOM_SAMPLING algorithm', () => {
      expect(service.isMoocletAlgorithm(ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING)).toBe(false);
    });
  });

  // ============================================================================
  // TS Configurable Default Parameters
  // ============================================================================

  describe('getTSConfigurableDefaults', () => {
    it('should return a MoocletTSConfigurablePolicyParametersDTO instance', () => {
      const result = service.getTSConfigurableDefaults();
      expect(result).toBeInstanceOf(MoocletTSConfigurablePolicyParametersDTO);
    });

    it('should return default values matching DTO defaults', () => {
      const result = service.getTSConfigurableDefaults();
      const expected = new MoocletTSConfigurablePolicyParametersDTO();

      expect(result.batch_size).toBe(expected.batch_size);
      expect(result.uniform_threshold).toBe(expected.uniform_threshold);
      expect(result.tspostdiff_thresh).toBe(expected.tspostdiff_thresh);
      expect(result.prior).toEqual(expected.prior);
      expect(result.max_rating).toBe(expected.max_rating);
      expect(result.min_rating).toBe(expected.min_rating);
    });
  });

  // ============================================================================
  // Derive Editable Parameters
  // ============================================================================

  describe('deriveEditableParametersForTSConfigurable', () => {
    it('should return default values when no existing params provided', () => {
      const result = service.deriveEditableParametersForTSConfigurable();
      const defaults = new MoocletTSConfigurablePolicyParametersDTO();

      expect(result).toEqual({
        batch_size: defaults.batch_size,
        uniform_threshold: defaults.uniform_threshold,
        tspostdiff_thresh: defaults.tspostdiff_thresh,
        prior_success: defaults.prior.success,
        prior_failure: defaults.prior.failure,
      });
    });

    it('should return default values when existing params is undefined', () => {
      const result = service.deriveEditableParametersForTSConfigurable(undefined);
      const defaults = new MoocletTSConfigurablePolicyParametersDTO();

      expect(result.batch_size).toBe(defaults.batch_size);
      expect(result.prior_success).toBe(defaults.prior.success);
    });

    it('should extract editable fields from existing params', () => {
      const existingParams = createMockTSConfigurableParams({
        batch_size: 50,
        uniform_threshold: 100,
        tspostdiff_thresh: 5,
        prior: { success: 10, failure: 10 },
      });

      const result = service.deriveEditableParametersForTSConfigurable(existingParams);

      expect(result).toEqual({
        batch_size: 50,
        uniform_threshold: 100,
        tspostdiff_thresh: 5,
        prior_success: 10,
        prior_failure: 10,
      });
    });

    it('should flatten nested prior object into prior_success and prior_failure', () => {
      const existingParams = createMockTSConfigurableParams({
        prior: { success: 20, failure: 30 },
      });

      const result = service.deriveEditableParametersForTSConfigurable(existingParams);

      expect(result.prior_success).toBe(20);
      expect(result.prior_failure).toBe(30);
      expect((result as any).prior).toBeUndefined();
    });

    it('should not include non-editable fields in result', () => {
      const existingParams = createMockTSConfigurableParams({
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
        outcome_variable_name: 'test_outcome',
        max_rating: 5,
        min_rating: 1,
      });

      const result = service.deriveEditableParametersForTSConfigurable(existingParams);

      expect((result as any).assignmentAlgorithm).toBeUndefined();
      expect((result as any).outcome_variable_name).toBeUndefined();
      expect((result as any).max_rating).toBeUndefined();
      expect((result as any).min_rating).toBeUndefined();
    });
  });

  // ============================================================================
  // Build Complete DTO
  // ============================================================================

  describe('buildTSConfigurablePolicyParametersDTO', () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:30:00.000Z');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should build complete DTO from editable parameters', () => {
      const editableParams: EditableTSConfigurablePolicyParameters = {
        batch_size: 50,
        uniform_threshold: 100,
        tspostdiff_thresh: 5,
        prior_success: 10,
        prior_failure: 10,
      };

      const result = service.buildTSConfigurablePolicyParametersDTO(editableParams, 'Test Experiment');

      expect(result.batch_size).toBe(50);
      expect(result.uniform_threshold).toBe(100);
      expect(result.tspostdiff_thresh).toBe(5);
      expect(result.prior).toEqual({ success: 10, failure: 10 });
    });

    it('should set assignmentAlgorithm to MOOCLET_TS_CONFIGURABLE', () => {
      const editableParams = createMockEditableParams();
      const result = service.buildTSConfigurablePolicyParametersDTO(editableParams, 'Test');

      expect(result.assignmentAlgorithm).toBe(ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE);
    });

    it('should not set outcome_variable_name since it is generated server-side', () => {
      const editableParams = createMockEditableParams();
      const result = service.buildTSConfigurablePolicyParametersDTO(editableParams, 'My Experiment');

      expect(result.outcome_variable_name).toBeUndefined();
    });

    it('should set max_rating and min_rating from defaults', () => {
      const editableParams = createMockEditableParams();
      const defaults = service.getTSConfigurableDefaults();

      const result = service.buildTSConfigurablePolicyParametersDTO(editableParams, 'Test');

      expect(result.max_rating).toBe(defaults.max_rating);
      expect(result.min_rating).toBe(defaults.min_rating);
    });

    it('should convert flat prior fields to nested prior object', () => {
      const editableParams: EditableTSConfigurablePolicyParameters = {
        batch_size: 30,
        uniform_threshold: 50,
        tspostdiff_thresh: 3,
        prior_success: 15,
        prior_failure: 20,
      };

      const result = service.buildTSConfigurablePolicyParametersDTO(editableParams, 'Test');

      expect(result.prior).toBeDefined();
      expect(result.prior.success).toBe(15);
      expect(result.prior.failure).toBe(20);
    });

    it('should not include outcome_variable_name for any experiment name', () => {
      const editableParams = createMockEditableParams();

      const result1 = service.buildTSConfigurablePolicyParametersDTO(editableParams, 'Short');
      const result2 = service.buildTSConfigurablePolicyParametersDTO(
        editableParams,
        'Very Long Experiment Name With Many Words'
      );

      expect(result1.outcome_variable_name).toBeUndefined();
      expect(result2.outcome_variable_name).toBeUndefined();
    });
  });

  // ============================================================================
  // Field Validators
  // ============================================================================

  describe('getTSConfigurableFieldValidators', () => {
    it('should return validators for all editable fields', () => {
      const validators = service.getTSConfigurableFieldValidators();

      expect(validators.batch_size).toBeDefined();
      expect(validators.uniform_threshold).toBeDefined();
      expect(validators.tspostdiff_thresh).toBeDefined();
      expect(validators.prior_success).toBeDefined();
      expect(validators.prior_failure).toBeDefined();
    });

    it('should include required validator for all fields', () => {
      const validators = service.getTSConfigurableFieldValidators();

      Object.values(validators).forEach((fieldValidators) => {
        expect(fieldValidators).toContain(Validators.required);
      });
    });

    it('should include min validators based on defaults', () => {
      const validators = service.getTSConfigurableFieldValidators();
      const defaults = service.getTSConfigurableDefaults();

      expect(validators.batch_size.length).toBe(4);
      expect(validators.uniform_threshold.length).toBe(4);
      expect(validators.prior_success.length).toBe(4);
      expect(validators.prior_failure.length).toBe(4);

      expect(validators.tspostdiff_thresh.length).toBe(3);

      // Test that min validator works correctly for batch_size
      const batchSizeMinValidator = validators.batch_size[1];
      // Use a value below the minimum - should fail (return error object)
      expect(batchSizeMinValidator({ value: defaults.batch_size - 1 } as any)).toBeTruthy();
      // Use the minimum value - should pass (return null)
      expect(batchSizeMinValidator({ value: defaults.batch_size } as any)).toBeNull();
      // Use a value above the minimum - should pass (return null)
      expect(batchSizeMinValidator({ value: defaults.batch_size + 1 } as any)).toBeNull();
    });

    it('should return exactly 3 validators per field (required + min)', () => {
      const validators = service.getTSConfigurableFieldValidators();

      Object.values(validators).forEach((fieldValidators) => {
        if (fieldValidators === validators.tspostdiff_thresh) {
          expect(fieldValidators.length).toBe(3);
          return;
        }
        expect(fieldValidators.length).toBe(4);
      });
    });
  });

  // ============================================================================
  // Supported Mooclet Algorithms
  // ============================================================================

  describe('getSupportedMoocletAlgorithmOptions', () => {
    it('should return empty array when mooclet is disabled', () => {
      environment.moocletToggle = false;
      const result = service.getSupportedMoocletAlgorithmOptions();

      expect(result).toEqual([]);
    });

    it('should return algorithm options when mooclet is enabled', () => {
      environment.moocletToggle = true;
      const result = service.getSupportedMoocletAlgorithmOptions();

      expect(result.length).toBeGreaterThan(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return options with value and description properties', () => {
      environment.moocletToggle = true;
      const result = service.getSupportedMoocletAlgorithmOptions();

      result.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('description');
        expect(typeof option.value).toBe('string');
        expect(typeof option.description).toBe('string');
      });
    });

    it('should include MOOCLET_TS_CONFIGURABLE in options', () => {
      environment.moocletToggle = true;
      const result = service.getSupportedMoocletAlgorithmOptions();

      const tsConfigOption = result.find((opt) => opt.value === ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE);
      expect(tsConfigOption).toBeDefined();
      expect(tsConfigOption.description).toContain('Adaptive Experiment Algorithm');
    });

    it('should format description correctly', () => {
      environment.moocletToggle = true;
      const result = service.getSupportedMoocletAlgorithmOptions();

      result.forEach((option) => {
        expect(option.description).toMatch(/^Adaptive Experiment Algorithm: /);
        expect(option.description).toContain(option.value);
      });
    });
  });

  // ============================================================================
  // Validation
  // ============================================================================

  describe('validateTSConfigurablePolicyParameters', () => {
    it('should return observable of validation errors', (done) => {
      const params = createMockTSConfigurableParams();

      service.validateTSConfigurablePolicyParameters(params).subscribe((errors) => {
        expect(Array.isArray(errors)).toBe(true);
        done();
      });
    });

    it('should validate valid parameters successfully', (done) => {
      const validParams = {
        batch_size: 30,
        uniform_threshold: 50,
        tspostdiff_thresh: 3,
        prior: { success: 1, failure: 1 },
        outcome_variable_name: 'test_outcome',
        max_rating: 5,
        min_rating: 1,
      };

      service.validateTSConfigurablePolicyParameters(validParams).subscribe((errors) => {
        expect(errors.length).toBe(0);
        done();
      });
    });

    it('should add assignmentAlgorithm automatically', (done) => {
      const params = {
        batch_size: 30,
        uniform_threshold: 50,
        tspostdiff_thresh: 3,
        prior: { success: 1, failure: 1 },
        outcome_variable_name: 'test',
        max_rating: 5,
        min_rating: 1,
      };

      service.validateTSConfigurablePolicyParameters(params).subscribe((errors) => {
        expect(errors.length).toBe(0);
        done();
      });
    });

    it('should validate successfully even with empty outcome_variable_name', (done) => {
      const params = {
        batch_size: 30,
        uniform_threshold: 50,
        tspostdiff_thresh: 3,
        prior: { success: 1, failure: 1 },
        outcome_variable_name: '', // Empty string should not cause validation errors
        max_rating: 5,
        min_rating: 1,
      };

      service.validateTSConfigurablePolicyParameters(params).subscribe((errors) => {
        expect(errors.length).toBe(0);
        done();
      });
    });

    it('should validate successfully without outcome_variable_name property', (done) => {
      const params = {
        batch_size: 30,
        uniform_threshold: 50,
        tspostdiff_thresh: 3,
        prior: { success: 1, failure: 1 },
        // outcome_variable_name property completely missing
        max_rating: 5,
        min_rating: 1,
      };

      service.validateTSConfigurablePolicyParameters(params).subscribe((errors) => {
        expect(errors.length).toBe(0);
        done();
      });
    });
  });
});

// ============================================================================
// Pure Function Tests
// ============================================================================

describe('formatTSConfigurablePolicyParamDetails (pure function)', () => {
  it('should return undefined when mooclet toggle is disabled', () => {
    environment.moocletToggle = false;
    const experiment = createMockExperimentVM();

    const result = formatTSConfigurablePolicyParamDetails(experiment);

    expect(result).toBeUndefined();
  });

  it('should return undefined when algorithm is not TS_CONFIGURABLE', () => {
    environment.moocletToggle = true;
    const experiment = createMockExperimentVM({
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
    });

    const result = formatTSConfigurablePolicyParamDetails(experiment);

    expect(result).toBeUndefined();
  });

  it('should return undefined when moocletPolicyParameters is missing', () => {
    environment.moocletToggle = true;
    const experiment = createMockExperimentVM({
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      moocletPolicyParameters: undefined,
    });

    const result = formatTSConfigurablePolicyParamDetails(experiment);

    expect(result).toBeUndefined();
  });

  it('should format parameters correctly', () => {
    environment.moocletToggle = true;
    const experiment = createMockExperimentVM({
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      moocletPolicyParameters: createMockTSConfigurableParams({
        batch_size: 50,
        uniform_threshold: 100,
        tspostdiff_thresh: 5,
        prior: { success: 10, failure: 10 },
      }),
    });

    const result = formatTSConfigurablePolicyParamDetails(experiment);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(5);
  });

  it('should include prior values in formatted output', () => {
    environment.moocletToggle = true;
    const experiment = createMockExperimentVM({
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      moocletPolicyParameters: createMockTSConfigurableParams({
        prior: { success: 15, failure: 20 },
      }),
    });

    const result = formatTSConfigurablePolicyParamDetails(experiment);

    expect(result.some((param) => param.value === 15)).toBe(true);
    expect(result.some((param) => param.value === 20)).toBe(true);
  });

  it('should include all configurable parameters', () => {
    environment.moocletToggle = true;
    const experiment = createMockExperimentVM({
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      moocletPolicyParameters: createMockTSConfigurableParams({
        batch_size: 50,
        uniform_threshold: 100,
        tspostdiff_thresh: 5,
        prior: { success: 10, failure: 10 },
      }),
    });

    const result = formatTSConfigurablePolicyParamDetails(experiment);
    const values = result.map((param) => param.value);

    expect(values).toContain(50);
    expect(values).toContain(100);
    expect(values).toContain(5);
    expect(values).toContain(10);
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function createMockEditableParams(
  overrides?: Partial<EditableTSConfigurablePolicyParameters>
): EditableTSConfigurablePolicyParameters {
  const defaults = new MoocletTSConfigurablePolicyParametersDTO();
  return {
    batch_size: defaults.batch_size,
    uniform_threshold: defaults.uniform_threshold,
    tspostdiff_thresh: defaults.tspostdiff_thresh,
    prior_success: defaults.prior.success,
    prior_failure: defaults.prior.failure,
    ...overrides,
  };
}

function createMockTSConfigurableParams(
  overrides?: Partial<MoocletTSConfigurablePolicyParametersDTO>
): MoocletTSConfigurablePolicyParametersDTO {
  const defaults = new MoocletTSConfigurablePolicyParametersDTO();
  return {
    ...defaults,
    assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
    outcome_variable_name: 'test_outcome',
    ...overrides,
  } as MoocletTSConfigurablePolicyParametersDTO;
}

function createMockExperimentVM(overrides?: Partial<ExperimentVM>): ExperimentVM {
  return {
    id: 'exp-1',
    name: 'Test Experiment',
    assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
    moocletPolicyParameters: undefined,
    ...overrides,
  } as ExperimentVM;
}
