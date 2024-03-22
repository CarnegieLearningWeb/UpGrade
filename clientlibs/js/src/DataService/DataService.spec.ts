import { EXPERIMENT_TYPE, IExperimentAssignmentv5, IFeatureFlag, PAYLOAD_TYPE } from 'upgrade_types';
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
      const featureFlags: IFeatureFlag[] = [
        {
          id: 'abc123',
          name: 'testFlag',
          key: 'testFlagKey',
          description: 'testFlagDescription',
          variationType: 'test',
          status: true,
          variations: [
            {
              id: 'abc123',
              value: 'flagVariation1',
              name: 'flagVariation1',
              description: 'flagVariation1',
              defaultVariation: [true],
            },
          ],
        },
      ];

      dataService.setFeatureFlags(featureFlags);
      expect(dataService.getFeatureFlags()).toEqual(featureFlags);
    });
  });

  describe('#setFeatureFlags', () => {
    it('should set the feature flags', () => {
      const featureFlags: IFeatureFlag[] = [
        {
          id: 'abc123',
          name: 'testFlag',
          key: 'testFlagKey',
          description: 'testFlagDescription',
          variationType: 'test',
          status: true,
          variations: [
            {
              id: 'abc123',
              value: 'flagVariation1',
              name: 'flagVariation1',
              description: 'flagVariation1',
              defaultVariation: [true],
            },
          ],
        },
      ];

      dataService.setFeatureFlags(featureFlags);
      expect(dataService.getFeatureFlags()).toEqual(featureFlags);
    });
  });

  describe('#rotateAssignmentList', () => {
    it('should return the rotated assignment list', () => {
      const assignmentList: IExperimentAssignmentv5 = {
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

      const expectedRotatedAssignmentList: IExperimentAssignmentv5 = {
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
      const assignmentList: IExperimentAssignmentv5 = {
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

      const expectedRotatedAssignmentList: IExperimentAssignmentv5 = {
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
      const assignmentList: IExperimentAssignmentv5 = {
        site: 'site',
        target: 'target',
        assignedCondition: [],
        assignedFactor: [],
        experimentType: EXPERIMENT_TYPE.SIMPLE,
      };

      const expectedRotatedAssignmentList: IExperimentAssignmentv5 = {
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

  describe('#findExperimentAssignmentBySiteAndTarget', () => {
    it('should return the experiment assignment', () => {
      const experimentAssignmentData: IExperimentAssignmentv5[] = [
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

    it('should return undefined if no site + target match is found', () => {
      const experimentAssignmentData: IExperimentAssignmentv5[] = [
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
      expect(dataService.findExperimentAssignmentBySiteAndTarget('site', 'target1')).toEqual(undefined);
    });
  });
});
