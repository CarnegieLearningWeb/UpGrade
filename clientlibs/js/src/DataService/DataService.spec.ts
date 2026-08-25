import { EXPERIMENT_TYPE, IExperimentAssignment, IFeatureFlag, PAYLOAD_TYPE } from 'upgrade_types';
import { DataService } from './DataService';

describe('DataService', () => {
  let dataService: DataService;

  beforeEach(() => {
    dataService = new DataService();
  });

  describe('#getGroup', () => {
    it('should return the group', () => {
      const group = { school: ['group-id'] };

      dataService.setGroup(group);
      expect(dataService.getGroup()).toEqual(group);
    });
  });

  describe('#setGroup', () => {
    it('should set the group', () => {
      const group = { school: ['group-id'] };

      dataService.setGroup(group);
      expect(dataService.getGroup()).toEqual(group);
    });
  });

  describe('#getWorkingGroup', () => {
    it('should return the working group', () => {
      const workingGroup = { school: 'group-id' };

      dataService.setWorkingGroup(workingGroup);
      expect(dataService.getWorkingGroup()).toEqual(workingGroup);
    });
  });

  describe('#setWorkingGroup', () => {
    it('should set the working group', () => {
      const workingGroup = { school: 'group-id' };

      dataService.setWorkingGroup(workingGroup);
      expect(dataService.getWorkingGroup()).toEqual(workingGroup);
    });
  });

  describe('#getExperimentAssignmentData', () => {
    it('should return the experiment assignment data', () => {
      const experimentAssignmentData = [
        {
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
        },
      ];

      dataService.setExperimentAssignmentData(experimentAssignmentData);
      expect(dataService.getExperimentAssignmentData()).toEqual(experimentAssignmentData);
    });
  });

  describe('#setExperimentAssignmentData', () => {
    it('should set the experiment assignment data', () => {
      const experimentAssignmentData = [
        {
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
        },
      ];

      dataService.setExperimentAssignmentData(experimentAssignmentData);
      expect(dataService.getExperimentAssignmentData()).toEqual(experimentAssignmentData);
    });
  });

  describe('#getFeatureFlags', () => {
    it('should return the feature flags', () => {
      const featureFlagsKeys: string[] = ['testFlagKey'];

      dataService.setFeatureFlags(featureFlagsKeys);
      expect(dataService.getFeatureFlags()).toEqual(featureFlagsKeys);
    });
  });

  describe('#setFeatureFlags', () => {
    it('should set the feature flags', () => {
      const featureFlagsKeys: string[] = ['testFlagKey'];

      dataService.setFeatureFlags(featureFlagsKeys);
      expect(dataService.getFeatureFlags()).toEqual(featureFlagsKeys);
    });
  });

  describe('#clearFeatureFlags', () => {
    it('should clear previously set feature flags', () => {
      dataService.setFeatureFlags(['testFlagKey']);

      dataService.clearFeatureFlags();

      expect(dataService.getFeatureFlags()).toBeNull();
    });
  });

  describe('#rotateAssignmentList', () => {
    it('should return the rotated assignment list', () => {
      const assignmentList: IExperimentAssignment = {
        site: 'site',
        target: 'target',
        assignedCondition: [
          {
            conditionCode: 'control',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testControl' },
            experimentId: 'abc123',
            id: 'xyz321',
          },
          {
            conditionCode: 'variant_x',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testVariant' },
            experimentId: 'abc123',
            id: 'asdfasdf',
          },
        ],
        assignedFactor: [
          {
            factor1: { level: 'level1', payload: { type: PAYLOAD_TYPE.STRING, value: 'testLevel1' } },
          },
          {
            factor2: { level: 'level2', payload: { type: PAYLOAD_TYPE.STRING, value: 'testLevel2' } },
          },
        ],
        experimentType: EXPERIMENT_TYPE.FACTORIAL,
      };

      const expectedRotatedAssignmentList: IExperimentAssignment = {
        site: 'site',
        target: 'target',
        assignedCondition: [
          {
            conditionCode: 'variant_x',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testVariant' },
            experimentId: 'abc123',
            id: 'asdfasdf',
          },
          {
            conditionCode: 'control',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testControl' },
            experimentId: 'abc123',
            id: 'xyz321',
          },
        ],
        assignedFactor: [
          {
            factor2: { level: 'level2', payload: { type: PAYLOAD_TYPE.STRING, value: 'testLevel2' } },
          },
          {
            factor1: { level: 'level1', payload: { type: PAYLOAD_TYPE.STRING, value: 'testLevel1' } },
          },
        ],
        experimentType: EXPERIMENT_TYPE.FACTORIAL,
      };

      dataService.rotateAssignmentList(assignmentList);

      expect(assignmentList).toEqual(expectedRotatedAssignmentList);
    });

    it('should return the rotated assignment list with no assigned factors', () => {
      const assignmentList: IExperimentAssignment = {
        site: 'site',
        target: 'target',
        assignedCondition: [
          {
            conditionCode: 'control',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testControl' },
            experimentId: 'abc123',
            id: 'xyz321',
          },
          {
            conditionCode: 'variant_x',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testVariant' },
            experimentId: 'abc123',
            id: 'asdfasdf',
          },
        ],
        assignedFactor: [],
        experimentType: EXPERIMENT_TYPE.SIMPLE,
      };

      const expectedRotatedAssignmentList: IExperimentAssignment = {
        site: 'site',
        target: 'target',
        assignedCondition: [
          {
            conditionCode: 'variant_x',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testVariant' },
            experimentId: 'abc123',
            id: 'asdfasdf',
          },
          {
            conditionCode: 'control',
            payload: { type: PAYLOAD_TYPE.STRING, value: 'testControl' },
            experimentId: 'abc123',
            id: 'xyz321',
          },
        ],
        assignedFactor: [],
        experimentType: EXPERIMENT_TYPE.SIMPLE,
      };

      dataService.rotateAssignmentList(assignmentList);

      expect(assignmentList).toEqual(expectedRotatedAssignmentList);
    });

    it('should return the rotated assignment list with no assigned conditions', () => {
      const assignmentList: IExperimentAssignment = {
        site: 'site',
        target: 'target',
        assignedCondition: [],
        assignedFactor: [],
        experimentType: EXPERIMENT_TYPE.SIMPLE,
      };

      const expectedRotatedAssignmentList: IExperimentAssignment = {
        site: 'site',
        target: 'target',
        assignedCondition: [],
        assignedFactor: [],
        experimentType: EXPERIMENT_TYPE.SIMPLE,
      };

      dataService.rotateAssignmentList(assignmentList);

      expect(assignmentList).toEqual(expectedRotatedAssignmentList);
    });
  });

  describe('#rotateAssignmentsByExperimentId', () => {
    it('should rotate only assignments that contain the provided experiment id', () => {
      const experimentAssignmentData: IExperimentAssignment[] = [
        {
          site: 'siteA',
          target: 'targetA',
          assignedCondition: [
            {
              conditionCode: 'control',
              payload: { type: PAYLOAD_TYPE.STRING, value: 'testControlA' },
              experimentId: 'exp-1',
              id: 'cond-a1',
            },
            {
              conditionCode: 'variant_x',
              payload: { type: PAYLOAD_TYPE.STRING, value: 'testVariantA' },
              experimentId: 'exp-1',
              id: 'cond-a2',
            },
          ],
          assignedFactor: [
            {
              factor1: { level: 'level1', payload: { type: PAYLOAD_TYPE.STRING, value: 'testLevel1' } },
            },
            {
              factor2: { level: 'level2', payload: { type: PAYLOAD_TYPE.STRING, value: 'testLevel2' } },
            },
          ],
          experimentType: EXPERIMENT_TYPE.FACTORIAL,
        },
        {
          site: 'siteB',
          target: 'targetB',
          assignedCondition: [
            {
              conditionCode: 'control',
              payload: { type: PAYLOAD_TYPE.STRING, value: 'testControlB' },
              experimentId: 'exp-2',
              id: 'cond-b1',
            },
            {
              conditionCode: 'variant_y',
              payload: { type: PAYLOAD_TYPE.STRING, value: 'testVariantB' },
              experimentId: 'exp-2',
              id: 'cond-b2',
            },
          ],
          assignedFactor: [],
          experimentType: EXPERIMENT_TYPE.SIMPLE,
        },
      ];

      dataService.setExperimentAssignmentData(experimentAssignmentData);

      dataService.rotateAssignmentsByExperimentId('exp-1');

      expect(experimentAssignmentData[0].assignedCondition[0].id).toBe('cond-a2');
      expect(experimentAssignmentData[0].assignedCondition[1].id).toBe('cond-a1');
      expect(experimentAssignmentData[1].assignedCondition[0].id).toBe('cond-b1');
      expect(experimentAssignmentData[1].assignedCondition[1].id).toBe('cond-b2');
    });

    it('should do nothing when there is no cached assignment data', () => {
      expect(() => dataService.rotateAssignmentsByExperimentId('exp-1')).not.toThrow();
    });
  });

  describe('#findExperimentAssignmentBySiteAndTarget', () => {
    it('should return the experiment assignment', () => {
      const experimentAssignmentData: IExperimentAssignment[] = [
        {
          site: 'site',
          target: 'target',
          assignedCondition: [
            {
              conditionCode: 'control',
              payload: { type: PAYLOAD_TYPE.STRING, value: 'testControl' },
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
        },
      ];

      dataService.setExperimentAssignmentData(experimentAssignmentData);
      expect(dataService.findExperimentAssignmentBySiteAndTarget('site', 'target')).toEqual(
        experimentAssignmentData[0]
      );
    });

    it('should normalize undefined target to empty string and return empty assignment', () => {
      const experimentAssignmentData: IExperimentAssignment[] = [
        {
          site: 'site',
          target: 'target',
          assignedCondition: [
            {
              conditionCode: 'control',
              payload: { type: PAYLOAD_TYPE.STRING, value: 'testControl' },
              experimentId: 'abc123',
              id: 'xyz321',
            },
          ],
          assignedFactor: [],
          experimentType: EXPERIMENT_TYPE.SIMPLE,
        },
      ];
      const emptyAssignment: IExperimentAssignment = {
        site: 'site',
        target: '',
        assignedCondition: [
          {
            payload: null,
            conditionCode: null,
            id: null,
          },
        ],
        experimentType: null,
      };
      dataService.setExperimentAssignmentData(experimentAssignmentData);
      expect(dataService.findExperimentAssignmentBySiteAndTarget('site', undefined)).toEqual(emptyAssignment);
    });

    it('should return undefined if no site + target match is found', () => {
      const experimentAssignmentData: IExperimentAssignment[] = [
        {
          site: 'site',
          target: 'target',
          assignedCondition: [
            {
              conditionCode: 'control',
              payload: { type: PAYLOAD_TYPE.STRING, value: 'testControl' },
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
        },
      ];
      const emptyAssignment: IExperimentAssignment = {
        site: 'site',
        target: 'target1',
        assignedCondition: [
          {
            payload: null,
            conditionCode: null,
            id: null,
          },
        ],
        experimentType: null,
      };
      dataService.setExperimentAssignmentData(experimentAssignmentData);
      expect(dataService.findExperimentAssignmentBySiteAndTarget('site', 'target1')).toEqual(emptyAssignment);
    });
  });
});
