import {
  EXPERIMENT_TYPE,
  IExperimentAssignmentv5,
  IPayload,
  MARKED_DECISION_POINT_STATUS,
  PAYLOAD_TYPE,
} from 'upgrade_types';
import Assignment from './Assignment';
import { UpGradeClientInterfaces } from 'types/Interfaces';

const defaultMockAssignment: IExperimentAssignmentv5 = {
  site: 'site',
  target: 'target',
  assignedCondition: [
    {
      conditionCode: 'variant_x',
      payload: { type: PAYLOAD_TYPE.STRING, value: 'testCondition' },
      experimentId: 'abc123',
      id: 'xyz321',
    },
  ],
  assignedFactor: [
    {
      factor1: { level: 'level1', payload: { type: PAYLOAD_TYPE.STRING, value: 'testLevel' } },
    },
  ],
  experimentType: EXPERIMENT_TYPE.FACTORIAL,
};

const MockApiService = {
  markDecisionPoint: jest.fn(),
};

describe('Assignment', () => {
  let assignmentUnderTest: Assignment;

  beforeEach(() => {
    assignmentUnderTest = null;
  });

  describe('#getCondition', () => {
    it('should return the value of _conditionCode', () => {
      const expected = 'variant_x';

      assignmentUnderTest = new Assignment(defaultMockAssignment, MockApiService as any);

      const actual = assignmentUnderTest.getCondition();

      expect(actual).toEqual(expected);
    });

    it('should return undefined if _conditionCode is undefined', () => {
      const expected: string = undefined;

      assignmentUnderTest = new Assignment({ ...defaultMockAssignment, assignedCondition: [] }, MockApiService as any);

      const actual = assignmentUnderTest.getCondition();

      expect(actual).toEqual(expected);
    });
  });

  describe('#getPayload', () => {
    it('should return the value of _payloadValue', () => {
      const expected: IPayload | null = { type: PAYLOAD_TYPE.STRING, value: 'testCondition' };

      assignmentUnderTest = new Assignment(defaultMockAssignment, MockApiService as any);

      const actual = assignmentUnderTest.getPayload();

      expect(actual).toEqual(expected);
    });

    it('should return null if _payloadValue is null', () => {
      const expected: IPayload | null = null;

      assignmentUnderTest = new Assignment({ ...defaultMockAssignment, assignedCondition: [] }, MockApiService as any);

      const actual = assignmentUnderTest.getPayload();

      expect(actual).toEqual(expected);
    });
  });

  describe('#getExperimentType', () => {
    it('should return EXPERIMENT_TYPE.FACTORIAL if _experimentType is factorial', () => {
      const expected = EXPERIMENT_TYPE.FACTORIAL;

      assignmentUnderTest = new Assignment(defaultMockAssignment, MockApiService as any);

      const actual = assignmentUnderTest.getExperimentType();

      expect(actual).toEqual(expected);
    });

    it('should return EXPERIMENT_TYPE.SIMPLE if _assignedFactor is null', () => {
      const expected = EXPERIMENT_TYPE.SIMPLE;

      assignmentUnderTest = new Assignment({ ...defaultMockAssignment, assignedFactor: null }, MockApiService as any);

      const actual = assignmentUnderTest.getExperimentType();

      expect(actual).toEqual(expected);
    });
  });

  describe('#get factors', () => {
    it('should return the value of _assignedFactor', () => {
      const expected = ['factor1'];

      assignmentUnderTest = new Assignment(defaultMockAssignment, MockApiService as any);

      const actual = assignmentUnderTest.factors;

      expect(actual).toEqual(expected);
    });

    it('should return null if _assignedFactor is null', () => {
      const expected: string[] = null;

      assignmentUnderTest = new Assignment({ ...defaultMockAssignment, assignedFactor: null }, MockApiService as any);

      const actual = assignmentUnderTest.factors;

      expect(actual).toEqual(expected);
    });
  });

  describe('#getFactorLevel', () => {
    it('should return the value of _factorLevel', () => {
      const expected = 'level1';

      assignmentUnderTest = new Assignment(defaultMockAssignment, MockApiService as any);

      const actual = assignmentUnderTest.getFactorLevel('factor1');

      expect(actual).toEqual(expected);
    });

    it('should return null if _factorLevel is null', () => {
      const expected: string = null;

      assignmentUnderTest = new Assignment({ ...defaultMockAssignment, assignedFactor: null }, MockApiService as any);

      const actual = assignmentUnderTest.getFactorLevel('factor1');

      expect(actual).toEqual(expected);
    });
  });

  describe('#getFactorPayload', () => {
    it('should return the value of _factorPayload', () => {
      const expected = { type: PAYLOAD_TYPE.STRING, value: 'testLevel' };

      assignmentUnderTest = new Assignment(defaultMockAssignment, MockApiService as any);

      const actual = assignmentUnderTest.getFactorPayload('factor1');

      expect(actual).toEqual(expected);
    });

    it('should return null if _factorPayload is null', () => {
      const expected: IPayload = null;

      assignmentUnderTest = new Assignment({ ...defaultMockAssignment, assignedFactor: null }, MockApiService as any);

      const actual = assignmentUnderTest.getFactorPayload('factor1');

      expect(actual).toEqual(expected);
    });
  });

  describe('#markDecisionPoint', () => {
    it('should call markDecisionPoint with correct params', async () => {
      assignmentUnderTest = new Assignment(defaultMockAssignment, MockApiService as any);

      const expectedCallingParams: UpGradeClientInterfaces.IMarkDecisionPointParams = {
        site: 'site',
        target: 'target',
        condition: 'variant_x',
        status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        uniquifier: undefined,
        clientError: undefined,
      };

      await assignmentUnderTest.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);

      expect(MockApiService.markDecisionPoint).toHaveBeenCalledWith(expectedCallingParams);
    });
  });
});
