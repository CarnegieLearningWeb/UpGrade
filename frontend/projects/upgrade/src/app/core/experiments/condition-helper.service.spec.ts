import { TestBed } from '@angular/core/testing';
import {
  ConditionHelperService,
  WEIGHT_CONFIG,
  determineWeightingMethod,
  distributeWeightsEqually,
  isWeightSumValid,
} from './condition-helper.service';
import { ExperimentService } from './experiments.service';
import { ExperimentCondition, WEIGHTING_METHOD } from './store/experiments.model';

describe('ConditionHelperService', () => {
  let service: ConditionHelperService;
  let mockExperimentService: any;

  beforeEach(() => {
    mockExperimentService = {
      updateExperimentConditions: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ConditionHelperService, { provide: ExperimentService, useValue: mockExperimentService }],
    });

    service = TestBed.inject(ConditionHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('WEIGHT_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(WEIGHT_CONFIG.TOTAL_WEIGHT).toBe(100);
      expect(WEIGHT_CONFIG.DECIMAL_PLACES).toBe(2);
      expect(WEIGHT_CONFIG.VALIDATION_TOLERANCE).toBe(0.1);
    });
  });

  describe('determineWeightingMethod (pure function)', () => {
    it('should return EQUAL for empty conditions array', () => {
      const result = determineWeightingMethod([]);
      expect(result).toBe(WEIGHTING_METHOD.EQUAL);
    });

    it('should return EQUAL for null/undefined conditions', () => {
      expect(determineWeightingMethod(null)).toBe(WEIGHTING_METHOD.EQUAL);
      expect(determineWeightingMethod(undefined)).toBe(WEIGHTING_METHOD.EQUAL);
    });

    it('should return EQUAL for single condition with 100% weight', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 100)];
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.EQUAL);
    });

    it('should return EQUAL for 2 conditions with 50/50 split', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 50), createCondition('Treatment', 50)];
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.EQUAL);
    });

    it('should return EQUAL for 3 conditions with 33.33 each (total 99.99)', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 33.33),
        createCondition('B', 33.33),
        createCondition('C', 33.33),
      ];
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.EQUAL);
    });

    it('should return EQUAL for 4 conditions with 25 each', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 25),
        createCondition('B', 25),
        createCondition('C', 25),
        createCondition('D', 25),
      ];
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.EQUAL);
    });

    it('should return CUSTOM for unequal weights', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 40), createCondition('Treatment', 60)];
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.CUSTOM);
    });

    it('should return CUSTOM for 3 conditions with custom split', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 20),
        createCondition('B', 30),
        createCondition('C', 50),
      ];
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.CUSTOM);
    });

    it('should return EQUAL for weights within tolerance', () => {
      // Expected weight is 33.33, actual is 33.32 (within 0.1 tolerance)
      const conditions: ExperimentCondition[] = [
        createCondition('A', 33.32),
        createCondition('B', 33.33),
        createCondition('C', 33.33),
      ];
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.EQUAL);
    });

    it('should handle 7 conditions (14.29 each)', () => {
      const conditions: ExperimentCondition[] = Array(7)
        .fill(null)
        .map((_, i) => createCondition(`Condition${i}`, 14.29));
      const result = determineWeightingMethod(conditions);
      expect(result).toBe(WEIGHTING_METHOD.EQUAL);
    });
  });

  describe('distributeWeightsEqually (pure function)', () => {
    it('should not modify empty array', () => {
      const conditions: ExperimentCondition[] = [];
      distributeWeightsEqually(conditions);
      expect(conditions.length).toBe(0);
    });

    it('should set single condition to 100', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 0)];
      distributeWeightsEqually(conditions);
      expect(conditions[0].assignmentWeight).toBe(100);
    });

    it('should distribute 50/50 for 2 conditions', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 0), createCondition('Treatment', 0)];
      distributeWeightsEqually(conditions);
      expect(conditions[0].assignmentWeight).toBe(50);
      expect(conditions[1].assignmentWeight).toBe(50);
    });

    it('should distribute 33.33/33.33/33.33 for 3 conditions (total 99.99)', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 0),
        createCondition('B', 0),
        createCondition('C', 0),
      ];
      distributeWeightsEqually(conditions);

      // All should be 33.33 (truly equal)
      expect(conditions[0].assignmentWeight).toBe(33.33);
      expect(conditions[1].assignmentWeight).toBe(33.33);
      expect(conditions[2].assignmentWeight).toBe(33.33);

      // Total should be 99.99 (acceptable per requirements)
      const total = conditions.reduce((sum, c) => sum + c.assignmentWeight, 0);
      expect(total).toBe(99.99);
    });

    it('should distribute 25/25/25/25 for 4 conditions', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 0),
        createCondition('B', 0),
        createCondition('C', 0),
        createCondition('D', 0),
      ];
      distributeWeightsEqually(conditions);

      conditions.forEach((c) => {
        expect(c.assignmentWeight).toBe(25);
      });

      const total = conditions.reduce((sum, c) => sum + c.assignmentWeight, 0);
      expect(total).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      const conditions: ExperimentCondition[] = Array(7)
        .fill(null)
        .map((_, i) => createCondition(`C${i}`, 0));
      distributeWeightsEqually(conditions);

      // 100 / 7 = 14.285714... should round to 14.29
      conditions.forEach((c) => {
        expect(c.assignmentWeight).toBe(14.29);
        // Verify exactly 2 decimal places
        const decimals = c.assignmentWeight.toString().split('.')[1];
        expect(decimals?.length || 0).toBeLessThanOrEqual(2);
      });
    });

    it('should handle 9 conditions (11.11 each)', () => {
      const conditions: ExperimentCondition[] = Array(9)
        .fill(null)
        .map((_, i) => createCondition(`C${i}`, 0));
      distributeWeightsEqually(conditions);

      conditions.forEach((c) => {
        expect(c.assignmentWeight).toBe(11.11);
      });

      const total = conditions.reduce((sum, c) => sum + c.assignmentWeight, 0);
      expect(total).toBeCloseTo(99.99, 2);
    });

    it('should overwrite existing weights', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 40),
        createCondition('B', 60),
        createCondition('C', 0),
      ];
      distributeWeightsEqually(conditions);

      conditions.forEach((c) => {
        expect(c.assignmentWeight).toBe(33.33);
      });
    });
  });

  describe('isWeightSumValid (pure function)', () => {
    it('should return true for empty conditions', () => {
      expect(isWeightSumValid([])).toBe(true);
    });

    it('should return true for null/undefined conditions', () => {
      expect(isWeightSumValid(null)).toBe(true);
      expect(isWeightSumValid(undefined)).toBe(true);
    });

    it('should return true for weights totaling exactly 100', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 50), createCondition('Treatment', 50)];
      expect(isWeightSumValid(conditions)).toBe(true);
    });

    it('should return true for weights totaling 99.99 (within tolerance)', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 33.33),
        createCondition('B', 33.33),
        createCondition('C', 33.33),
      ];
      expect(isWeightSumValid(conditions)).toBe(true);
    });

    it('should return true for weights totaling 100.01 (within tolerance)', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 33.34),
        createCondition('B', 33.34),
        createCondition('C', 33.33),
      ];
      expect(isWeightSumValid(conditions)).toBe(true);
    });

    it('should return true for weights at lower tolerance boundary (99.9)', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 99.9)];
      expect(isWeightSumValid(conditions)).toBe(true);
    });

    it('should return true for weights at upper tolerance boundary (100.1)', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 100.1)];
      expect(isWeightSumValid(conditions)).toBe(true);
    });

    it('should return false for weights totaling 90', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 30),
        createCondition('B', 30),
        createCondition('C', 30),
      ];
      expect(isWeightSumValid(conditions)).toBe(false);
    });

    it('should return false for weights totaling 110', () => {
      const conditions: ExperimentCondition[] = [
        createCondition('A', 40),
        createCondition('B', 40),
        createCondition('C', 30),
      ];
      expect(isWeightSumValid(conditions)).toBe(false);
    });

    it('should return false for weights outside lower tolerance (99.89)', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 99.89)];
      expect(isWeightSumValid(conditions)).toBe(false);
    });

    it('should return false for weights outside upper tolerance (100.11)', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 100.11)];
      expect(isWeightSumValid(conditions)).toBe(false);
    });

    it('should handle conditions with 0 weight', () => {
      const conditions: ExperimentCondition[] = [createCondition('A', 0), createCondition('B', 0)];
      expect(isWeightSumValid(conditions)).toBe(false);
    });

    it('should handle single condition at 100%', () => {
      const conditions: ExperimentCondition[] = [createCondition('Control', 100)];
      expect(isWeightSumValid(conditions)).toBe(true);
    });
  });

  describe('addCondition', () => {
    it('should add condition with 0 weight when not equal weighting', () => {
      const experiment = createExperiment([createCondition('A', 40), createCondition('B', 60)]);
      const conditionData = { conditionCode: 'C', description: 'Condition C' };

      service.addCondition(experiment, conditionData);

      expect(mockExperimentService.updateExperimentConditions).toHaveBeenCalled();
      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions.length).toBe(3);
      expect(updateRequest.conditions[2].conditionCode).toBe('C');
      expect(updateRequest.conditions[2].assignmentWeight).toBe(0);
    });

    it('should redistribute weights equally when adding to equal-weighted conditions', () => {
      const experiment = createExperiment([createCondition('A', 50), createCondition('B', 50)]);
      const conditionData = { conditionCode: 'C', description: 'Condition C' };

      service.addCondition(experiment, conditionData);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions.length).toBe(3);
      // All should be 33.33
      expect(updateRequest.conditions[0].assignmentWeight).toBe(33.33);
      expect(updateRequest.conditions[1].assignmentWeight).toBe(33.33);
      expect(updateRequest.conditions[2].assignmentWeight).toBe(33.33);
    });

    it('should set order correctly for new condition', () => {
      const experiment = createExperiment([createCondition('A', 50), createCondition('B', 50)]);
      const conditionData = { conditionCode: 'C', description: 'Condition C' };

      service.addCondition(experiment, conditionData);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions[2].order).toBe(3);
    });
  });

  describe('updateCondition', () => {
    it('should update condition code and description', () => {
      const condition = createCondition('A', 33.33);
      const experiment = createExperiment([condition, createCondition('B', 33.33), createCondition('C', 33.34)]);
      const conditionData = { conditionCode: 'A-Updated', description: 'Updated description' };

      service.updateCondition(experiment, condition, conditionData);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions[0].conditionCode).toBe('A-Updated');
      expect(updateRequest.conditions[0].description).toBe('Updated description');
    });

    it('should not modify weight when updating', () => {
      const condition = createCondition('A', 40);
      const experiment = createExperiment([condition, createCondition('B', 60)]);
      const conditionData = { conditionCode: 'A-Updated', description: 'Updated' };

      service.updateCondition(experiment, condition, conditionData);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions[0].assignmentWeight).toBe(40);
      expect(updateRequest.conditions[1].assignmentWeight).toBe(60);
    });
  });

  describe('deleteCondition', () => {
    it('should remove condition and redistribute weights if equal weighting', () => {
      const conditionToDelete = createCondition('B', 33.33);
      const experiment = createExperiment([
        createCondition('A', 33.33),
        conditionToDelete,
        createCondition('C', 33.33),
      ]);

      service.deleteCondition(experiment, conditionToDelete);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions.length).toBe(2);
      expect(updateRequest.conditions[0].assignmentWeight).toBe(50);
      expect(updateRequest.conditions[1].assignmentWeight).toBe(50);
    });

    it('should reorder remaining conditions after deletion', () => {
      const conditionToDelete = createCondition('B', 33.33);
      const experiment = createExperiment([
        createCondition('A', 33.33),
        conditionToDelete,
        createCondition('C', 33.33),
      ]);

      service.deleteCondition(experiment, conditionToDelete);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions[0].order).toBe(1);
      expect(updateRequest.conditions[1].order).toBe(2);
    });

    it('should not redistribute weights if custom weighting', () => {
      const conditionToDelete = createCondition('B', 30);
      const experiment = createExperiment([createCondition('A', 40), conditionToDelete, createCondition('C', 30)]);

      service.deleteCondition(experiment, conditionToDelete);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions.length).toBe(2);
      expect(updateRequest.conditions[0].assignmentWeight).toBe(40);
      expect(updateRequest.conditions[1].assignmentWeight).toBe(30);
    });

    it('should handle deleting last condition', () => {
      const conditionToDelete = createCondition('A', 100);
      const experiment = createExperiment([conditionToDelete]);

      service.deleteCondition(experiment, conditionToDelete);

      const updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      expect(updateRequest.conditions.length).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should maintain total weight near 100 after multiple operations', () => {
      // Start with 3 conditions
      let experiment = createExperiment([
        createCondition('A', 33.33),
        createCondition('B', 33.33),
        createCondition('C', 33.33),
      ]);

      // Add a condition (4 conditions at 25 each)
      service.addCondition(experiment, { conditionCode: 'D', description: 'D' });
      let updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      let total = updateRequest.conditions.reduce((sum, c) => sum + c.assignmentWeight, 0);
      expect(total).toBeCloseTo(100, 1);

      // Delete a condition (back to 3 conditions)
      experiment = { ...experiment, conditions: updateRequest.conditions };
      service.deleteCondition(experiment, updateRequest.conditions[1]);
      updateRequest = mockExperimentService.updateExperimentConditions.mock.lastCall[0];
      total = updateRequest.conditions.reduce((sum, c) => sum + c.assignmentWeight, 0);
      expect(total).toBeCloseTo(99.99, 1);
    });
  });
});

// Helper functions
function createCondition(code: string, weight: number): ExperimentCondition {
  return {
    id: `id-${code}`,
    name: code,
    description: `Description for ${code}`,
    conditionCode: code,
    assignmentWeight: weight,
    twoCharacterId: code.substring(0, 2),
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versionNumber: 1,
  };
}

function createExperiment(conditions: ExperimentCondition[]): any {
  return {
    id: 'exp-1',
    name: 'Test Experiment',
    conditions: conditions.map((c, i) => ({ ...c, order: i + 1 })),
    conditionPayloads: [],
  };
}
