import { HttpClient, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { ASSIGNMENT_ALGORITHM, CONDITION_ORDER, EXPERIMENT_TYPE, FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';
import { Segment_LEGACY } from '../segments_LEGACY/store/segments.model._LEGACY';
import { ExperimentDataService } from './experiments.data.service';
import {
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  Experiment,
  ExperimentPaginationParams,
  ExperimentStateInfo,
  EXPERIMENT_STATE,
  POST_EXPERIMENT_RULE,
  SegmentNew,
} from './store/experiments.model';
import { ExperimentFile } from '../../features/dashboard/home/components/modal/import-experiment/import-experiment.component';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
  put = jest.fn().mockReturnValue(of());
}

describe('ExperimentDataService', () => {
  let mockHttpClient: any;
  let mockEnvironment: Environment;
  let service: ExperimentDataService;
  let mockExperiment: Experiment;
  let mockExperimentId: string;
  let mockExperimentIds: string[];
  let mockParams: ExperimentPaginationParams;
  let mockEmail: string;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new ExperimentDataService(mockHttpClient as HttpClient, mockEnvironment);
    mockEmail = 'test@testmail.com';
    mockParams = {
      skip: 0,
      take: 10,
    };
    mockExperimentId = 'abc123';
    mockExperimentIds = ['abc123', 'qwerty99'];
    const segmentData: Segment_LEGACY = {
      id: 'segment-id',
      name: 'segment-name',
      description: 'segment-description',
      createdAt: '04/23/17 04:34:22 +0000',
      updatedAt: '04/23/17 04:34:22 +0000',
      versionNumber: 1,
      context: 'segment-context',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
      type: SEGMENT_TYPE.PUBLIC,
      status: 'segment-status',
    };

    const dummyInclusionData: SegmentNew = {
      updatedAt: '2022-06-20T13:14:52.900Z',
      createdAt: '2022-06-20T13:14:52.900Z',
      versionNumber: 1,
      segment: segmentData,
    };

    const dummyExclusionData: SegmentNew = {
      updatedAt: '2022-06-20T13:14:52.900Z',
      createdAt: '2022-06-20T13:14:52.900Z',
      versionNumber: 1,
      segment: segmentData,
    };
    mockExperiment = {
      id: 'abc123',
      name: 'abc123',
      description: 'abc123',
      createdAt: 'time',
      updatedAt: 'time',
      versionNumber: 0,
      state: EXPERIMENT_STATE.INACTIVE,
      context: [],
      startOn: 'test',
      consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
      assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
      conditionOrder: CONDITION_ORDER.RANDOM,
      postExperimentRule: POST_EXPERIMENT_RULE.ASSIGN,
      enrollmentCompleteCondition: {
        userCount: 1,
        groupCount: 2,
      },
      endOn: 'test',
      revertTo: 'test',
      tags: [],
      group: 'test',
      conditions: [],
      partitions: [],
      factors: [],
      conditionPayloads: [],
      queries: [],
      stateTimeLogs: [],
      backendVersion: '1.0.0',
      filterMode: FILTER_MODE.INCLUDE_ALL,
      groupSatisfied: 0,
      experimentSegmentInclusion: dummyInclusionData,
      experimentSegmentExclusion: dummyExclusionData,
      type: EXPERIMENT_TYPE.SIMPLE,
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
    };
  });

  describe('#getAllExperiment', () => {
    it('should get the getAllExperiment http observable', () => {
      const expectedUrl = mockEnvironment.api.getAllExperiments;
      const params = { ...mockParams };

      service.getAllExperiment(params);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
    });
  });

  describe('#getAllExperimentsStats', () => {
    it('should get the getAllExperimentsStats http observable', () => {
      const expectedUrl = mockEnvironment.api.experimentsStats;
      const experimentIds = [...mockExperimentIds];

      service.getAllExperimentsStats(experimentIds);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { experimentIds });
    });
  });

  describe('#getExperimentDetailStat', () => {
    it('should get the getExperimentDetailStat http observable', () => {
      const expectedUrl = mockEnvironment.api.experimentDetailStat;
      const experimentId = mockExperimentId;

      service.getExperimentDetailStat(experimentId);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { experimentId });
    });
  });

  describe('#createNewExperiment', () => {
    it('should get the createNewExperiment http observable', () => {
      const expectedUrl = mockEnvironment.api.createNewExperiments;
      const experiment = { ...mockExperiment };

      service.createNewExperiment(experiment);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { ...experiment });
    });
  });

  describe('#importExperiment', () => {
    it('should get the importExperiment http observable', () => {
      const mockUrl = mockEnvironment.api.importExperiment;
      const experiment = { ...mockExperiment };

      const experimentFile: ExperimentFile = { fileName: 'test.json', fileContent: JSON.stringify(experiment) };
      service.importExperiment([experimentFile]);

      expect(mockHttpClient.post).toHaveBeenCalledWith(mockUrl, [experimentFile]);
    });
  });

  describe('#updateExperiment', () => {
    it('should get the deleteExcludedGroup http observable', () => {
      const experiment = { ...mockExperiment };
      const expectedUrl = `${mockEnvironment.api.updateExperiments}/${experiment.id}`;

      service.updateExperiment(experiment);

      expect(mockHttpClient.put).toHaveBeenCalledWith(expectedUrl, { ...experiment });
    });
  });

  describe('#updateExperimentState', () => {
    it('should get the getAllExperiment http observable', () => {
      const expectedUrl = mockEnvironment.api.updateExperimentState;
      const experimentId = mockExperimentId;
      const experimentStateInfo: ExperimentStateInfo = {
        newStatus: EXPERIMENT_STATE.INACTIVE,
        scheduleDate: 'test',
      };

      service.updateExperimentState(experimentId, experimentStateInfo);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, {
        experimentId,
        state: experimentStateInfo.newStatus,
        scheduleDate: experimentStateInfo.scheduleDate,
      });
    });
  });

  describe('#deleteExperiment', () => {
    it('should get the deleteExperiment http observable', () => {
      const experimentId = mockExperimentId;
      const expectedUrl = `${mockEnvironment.api.updateExperiments}/${experimentId}`;

      service.deleteExperiment(experimentId);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#getExperimentById', () => {
    it('should get the getExperimentById http observable', () => {
      const experimentId = mockExperimentId;
      const expectedUrl = `${mockEnvironment.api.getExperimentById}/${experimentId}`;

      service.getExperimentById(experimentId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#fetchAllPartitions', () => {
    it('should get the fetchAllPartitions http observable', () => {
      const expectedUrl = mockEnvironment.api.allPartitions;

      service.fetchAllPartitions();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#fetchAllExperimentNames', () => {
    it('should get the fetchAllExperimentNames http observable', () => {
      const expectedUrl = mockEnvironment.api.allExperimentNames;

      service.fetchAllExperimentNames();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#exportExperimentInfo', () => {
    it('should get the exportExperimentInfo http observable', () => {
      const experimentId = mockExperimentId;
      const email = mockEmail;
      const expectedUrl = mockEnvironment.api.generateCsv;
      let experimentInfoParams = new HttpParams();
      experimentInfoParams = experimentInfoParams.append('experimentId', experimentId.toString());
      experimentInfoParams = experimentInfoParams.append('email', email.toString());

      service.exportExperimentInfo(experimentId, email);

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl, { params: experimentInfoParams });
    });
  });

  describe('#exportExperimentDesign', () => {
    it('should get the exportExperimentDesign http observable', () => {
      const experimentIds = [mockExperimentId];
      let ids = new HttpParams();
      experimentIds.forEach((id) => {
        ids = ids.append('ids', id.toString());
      });

      const expectedUrl = `${mockEnvironment.api.exportExperiment}`;

      service.exportExperimentDesign(experimentIds);

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl, { params: ids });
    });
  });

  describe('#fetchExperimentGraphInfo', () => {
    it('should get the fetchExperimentGraphInfo http observable', () => {
      const params = { ...mockParams };
      const expectedUrl = mockEnvironment.api.experimentGraphInfo;

      service.fetchExperimentGraphInfo(params);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
    });
  });

  describe('#fetchContextMetaData', () => {
    it('should get the fetchContextMetaData http observable', () => {
      const expectedUrl = mockEnvironment.api.contextMetaData;

      service.fetchContextMetaData();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
