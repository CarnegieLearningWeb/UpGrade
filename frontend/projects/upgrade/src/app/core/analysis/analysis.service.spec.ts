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
  let service: AnalysisService;

  beforeEach(() => {
    service = new AnalysisService(mockStore);
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
    it('should dispatch executeQuery with the supplied string input array', () => {
      const mockQueryIds = ['test', 'test2'];

      service.executeQuery(mockQueryIds);

      expect(mockStore.dispatch).toHaveBeenLastCalledWith(actionExecuteQuery({ queryIds: mockQueryIds }));
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
    it('should return empty array if node.id equals searchForKey', () => {
      const mockNode = { id: 'test', key: 'parent', children: [] };
      const mockSearchForKey = 'test';
      const expectedReturnValue = [];

      const actualReturnValue = service.findParents(mockNode, mockSearchForKey);

      expect(actualReturnValue).toEqual(expectedReturnValue);
    });

    it('should return undefined if node.children is not an array', () => {
      const mockNode = { id: '1', key: 'parent', children: null };
      const mockSearchForKey = 'test';
      const expectedReturnValue = undefined;

      const actualReturnValue = service.findParents(mockNode, mockSearchForKey);

      expect(actualReturnValue).toEqual(expectedReturnValue);
    });

    it('should return undefined if node.children.children is not an array', () => {
      const mockNode = {
        id: '1',
        key: 'parent',
        children: [{ id: '2', key: 'child', children: null }],
      };
      const mockSearchForKey = 'test';
      const expectedReturnValue = undefined;

      const actualReturnValue = service.findParents(mockNode, mockSearchForKey);

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
      const mockSearchForKey = '4';
      const expectedReturnValue = ['child', 'grandchild', 'greatgrandchild'];

      const actualReturnValue = service.findParents(mockNode, mockSearchForKey);

      expect(actualReturnValue).toEqual(expectedReturnValue);
    });
  });
});
