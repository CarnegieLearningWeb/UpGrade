import { BehaviorSubject } from 'rxjs';
import { AnalysisService } from './analysis.service';
import {
  actionDeleteMetric,
  actionExecuteQuery,
  actionSetMetricsFilterValue,
  actionSetQueryResult,
  actionUpsertMetrics,
} from './store/analysis.actions';
import { UpsertMetrics } from './store/analysis.models';
import { Environment } from '../../../environments/environment-types';

const mockStateStore$ = new BehaviorSubject({});
(mockStateStore$ as any).dispatch = jest.fn();

jest.mock('./store/analysis.selectors', () => ({
  selectMetrics: jest.fn(),
  selectIsMetricsLoading: jest.fn(),
  selectQueryResult: jest.fn(),
  selectIsQueryExecuting: jest.fn(),
  selectQueryResultById: jest.fn(),
}));

describe('AnalysisService', () => {
  const mockStore: any = mockStateStore$;
  let mockEnvironment: Environment = { metricAnalyticsExperimentDisplayToggle: true } as Environment;
  let service: AnalysisService;

  beforeEach(() => {
    service = new AnalysisService(mockStore, mockEnvironment);
    jest.resetAllMocks();
  });

  describe('#queryResultById$', () => {
    it('should ', () => {
      const mockId = 'test';
      const pipeSpy = jest.spyOn(mockStore, 'pipe');

      service.queryResultById$(mockId);

      expect(pipeSpy).toHaveBeenCalled();
    });
  });

  describe('#setMetricsFilterValue', () => {
    it('should dispatch actionSetMetricsFilterValue with the supplied string input', () => {
      const mockFilterString = 'test';

      service.setMetricsFilterValue(mockFilterString);

      expect(mockStore.dispatch).toHaveBeenLastCalledWith(
        actionSetMetricsFilterValue({ filterString: mockFilterString })
      );
    });
  });

  describe('#upsertMetrics', () => {
    it('should dispatch actionUpsertMetrics with the supplied metrics input', () => {
      const mockMetrics: UpsertMetrics = {
        metricUnit: [
          {
            key: 'test',
          },
        ],
      };

      service.upsertMetrics(mockMetrics);

      expect(mockStore.dispatch).toHaveBeenLastCalledWith(actionUpsertMetrics({ metrics: mockMetrics }));
    });
  });

  describe('#deleteMetric', () => {
    it('should dispatch actionDeleteMetric with the supplied string input', () => {
      const mockKey = 'test';

      service.deleteMetric(mockKey);

      expect(mockStore.dispatch).toHaveBeenLastCalledWith(actionDeleteMetric({ key: mockKey }));
    });
  });

  describe('#executeQuery', () => {
    let originalEnvironment;

    beforeEach(() => {
      // Save the original environment to restore it after tests
      originalEnvironment = { ...mockEnvironment };
    });

    afterEach(() => {
      // Restore the original environment after each test
      mockEnvironment = { ...originalEnvironment };
    });

    it('should dispatch executeQuery with the supplied string input array when metricAnalyticsExperimentDisplayToggle is true', () => {
      mockEnvironment = { metricAnalyticsExperimentDisplayToggle: true } as Environment;
      const mockQueryIds = ['test', 'test2'];

      service.executeQuery(mockQueryIds);

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionExecuteQuery({ queryIds: mockQueryIds }));
    });

    it('should not dispatch executeQuery and log a warning when metricAnalyticsExperimentDisplayToggle is false', () => {
      mockEnvironment = { metricAnalyticsExperimentDisplayToggle: false } as Environment;
      const mockQueryIds = ['test3', 'test4'];

      service.executeQuery(mockQueryIds);

      expect(mockStore.dispatch).not.toHaveBeenCalledWith(mockQueryIds);
    });
  });

  describe('#setQueryResult', () => {
    it('should dispatch setQueryResult with the supplied queryResult object input', () => {
      const mockQueryResult = { someKey: 'someValue' };

      service.setQueryResult(mockQueryResult);

      expect(mockStore.dispatch).toHaveBeenLastCalledWith(actionSetQueryResult({ queryResult: mockQueryResult }));
    });
  });

  describe('#findParents', () => {
    it('should return empty array if node.id equals the target id', () => {
      const mockNode = { id: 'test', key: 'parent', children: [] };

      const actualReturnValue = service.findParents(mockNode, 'test');

      expect(actualReturnValue).toEqual([]);
    });

    it('should return undefined if node.children is not an array', () => {
      const mockNode = { id: '1', key: 'parent', children: null };
      const mockTargetId = 'test';
      const expectedReturnValue = undefined;

      const actualReturnValue = service.findParents(mockNode, mockTargetId);

      expect(actualReturnValue).toEqual(expectedReturnValue);
    });

    it('should return undefined if node.children.children is not an array', () => {
      const mockNode = {
        id: '1',
        key: 'parent',
        children: [{ id: '2', key: 'child', children: null }],
      };
      const mockTargetId = 'test';
      const expectedReturnValue = undefined;

      const actualReturnValue = service.findParents(mockNode, mockTargetId);

      expect(actualReturnValue).toEqual(expectedReturnValue);
    });

    it('should traverse children of an object return an ordered list of the child key values', () => {
      const mockNode = {
        id: '1',
        key: 'parent',
        children: [
          {
            id: '2',
            key: 'child',
            children: [
              {
                id: '3',
                key: 'grandchild',
                children: [
                  {
                    id: '4',
                    key: 'greatgrandchild',
                    children: null,
                  },
                ],
              },
            ],
          },
        ],
      };
      const expectedReturnValue = ['child', 'grandchild', 'greatgrandchild'];

      const actualReturnValue = service.findParents(mockNode, '4');

      expect(actualReturnValue).toEqual(expectedReturnValue);
    });

    it('should find the correct node when duplicate keys exist at different branches', () => {
      const mockNode = {
        id: 'root',
        key: 'root',
        children: [
          {
            id: 'a',
            key: 'groupA',
            children: [{ id: 'a1', key: 'leaf', children: null }],
          },
          {
            id: 'b',
            key: 'groupB',
            children: [{ id: 'b2', key: 'leaf', children: null }],
          },
        ],
      };
      const expectedReturnValue = ['groupB', 'leaf'];

      const actualReturnValue = service.findParents(mockNode, 'b2');

      expect(actualReturnValue).toEqual(expectedReturnValue);
    });
  });
});
