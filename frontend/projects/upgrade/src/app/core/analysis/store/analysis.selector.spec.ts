import { initialState } from './analysis.reducer';
import * as AnalysisSelectors from './analysis.selectors';

describe('Analysis Selectors', () => {
  const mockState = { ...initialState };

  describe('#selectIsMetricsLoading', () => {
    it('should select isMetricsLoading boolean', () => {
      const state = { ...mockState };
      state.isMetricsLoading = true;

      const result = AnalysisSelectors.selectIsMetricsLoading.projector(state);

      expect(result).toEqual(true);
    });
  });

  describe('#selectIsQueryExecuting', () => {
    it('should select isQueryExecuting boolean', () => {
      const state = { ...mockState };
      state.isQueryExecuting = true;

      const result = AnalysisSelectors.selectIsQueryExecuting.projector(state);

      expect(result).toEqual(true);
    });
  });

  describe('#selectMetrics', () => {
    it('should select all metrics if no mericsFilter is present', () => {
      const state = { ...mockState };

      state.metricsFilter = '';
      state.metrics = [
        { key: 'test1', children: [] },
        { key: 'test2', children: [] },
      ];

      const result = AnalysisSelectors.selectMetrics.projector(state);

      expect(result).toEqual([
        { key: 'test1', children: [] },
        { key: 'test2', children: [] },
      ]);
    });

    it('should select all metrics where key matches metric key', () => {
      const state = { ...mockState };

      state.metricsFilter = 'test1';
      state.metrics = [
        { key: 'test1', children: [] },
        { key: 'test2', children: [] },
      ];

      const result = AnalysisSelectors.selectMetrics.projector(state);

      expect(result).toEqual([{ key: 'test1', children: [] }]);
    });
  });

  describe('#selectQueryResult', () => {
    it('should select queryResult', () => {
      const state = { ...mockState };
      state.queryResult = [];

      const result = AnalysisSelectors.selectQueryResult.projector(state);

      expect(result).toEqual([]);
    });
  });

  describe('#selectQueryResultById', () => {
    it('should select empty array if queryResult is falsey', () => {
      const state = { ...mockState };
      state.queryResult = undefined;

      const result = AnalysisSelectors.selectQueryResultById.projector(state, {
        queryId: 'test',
      });

      expect(result).toEqual([]);
    });

    it('should select query result by id', () => {
      const state = { ...mockState };
      state.queryResult = [
        {
          id: 'test',
          result: [
            {
              id: 'test123',
              totalSeconds: 3,
            },
          ],
        },
      ];

      const result = AnalysisSelectors.selectQueryResultById.projector(state, {
        queryId: 'test',
      });

      expect(result).toEqual([
        {
          id: 'test123',
          totalSeconds: 3,
        },
      ]);
    });

    it('should return empty array if no result found for that id', () => {
      const state = { ...mockState };
      state.queryResult = [
        {
          id: 'testX',
          result: [
            {
              id: 'test123',
              totalSeconds: 3,
            },
          ],
        },
      ];

      const result = AnalysisSelectors.selectQueryResultById.projector(state, {
        queryId: 'test',
      });

      expect(result).toEqual([]);
    });
  });
});
