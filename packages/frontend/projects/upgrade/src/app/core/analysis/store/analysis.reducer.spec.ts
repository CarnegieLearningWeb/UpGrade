import { analysisReducer, initialState } from './analysis.reducer';
import * as AnalysisActions from './analysis.actions';

describe('AnalysisReducer', () => {
  describe('actions to kick off requests w/ isLoading ', () => {
    const testActions = {
      actionFetchMetrics: AnalysisActions.actionFetchMetrics,
      actionDeleteMetric: AnalysisActions.actionDeleteMetric,
      actionUpsertMetrics: AnalysisActions.actionUpsertMetrics,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isMetricsLoading = false;

      const newState = analysisReducer(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoading: true`, () => {
        expect(newState.isMetricsLoading).toEqual(true);
      });
    }
  });

  describe('actions to request failures to set isloading to false', () => {
    const testActions = {
      actionFetchMetricsFailure: AnalysisActions.actionFetchMetricsFailure,
      actionDeleteMetricFailure: AnalysisActions.actionDeleteMetricFailure,
      actionUpsertMetricsFailure: AnalysisActions.actionUpsertMetricsFailure,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isMetricsLoading = true;

      const newState = analysisReducer(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoading: true`, () => {
        expect(newState.isMetricsLoading).toEqual(false);
      });
    }
  });

  it('actionFetchMetricsSuccess should set metrics and isMetricsLoading to false', () => {
    const previousState = { ...initialState };
    previousState.metrics = null;
    previousState.isMetricsLoading = true;
    const metrics = [];
    const action = AnalysisActions.actionFetchMetricsSuccess({
      metrics,
    });

    const newState = analysisReducer(previousState, action);

    expect(newState.metrics).toEqual(metrics);
    expect(newState.isMetricsLoading).toEqual(false);
  });

  describe('actionDeleteMetricSuccess', () => {
    it("should set metrics when key is defined and strip out '@__@' in keys and isMetricsLoading to false", () => {
      const metrics = [
        { key: 'filteredOutKey1', children: [] },
        { key: 'filteredOutKey2', children: [] },
        { key: 'keyTest', children: [] },
      ];
      const testCases = [
        {
          key: 'filteredOutKey1',
          expectedState: [
            { key: 'filteredOutKey2', children: [] },
            { key: 'keyTest', children: [] },
          ],
        },
        {
          key: 'filteredOutKey2',
          expectedState: [
            { key: 'filteredOutKey1', children: [] },
            { key: 'keyTest', children: [] },
          ],
        },
      ];

      testCases.forEach((testCase) => {
        const previousState = { ...initialState };
        previousState.metrics = [
          { key: 'filteredOutKey1', children: [] },
          { key: 'filteredOutKey2', children: [] },
          { key: 'keyTest', children: [] },
        ];
        previousState.isMetricsLoading = true;
        const action = AnalysisActions.actionDeleteMetricSuccess({
          metrics,
          key: testCase.key,
        });

        const newState = analysisReducer(previousState, action);

        expect(newState.metrics).toEqual(testCase.expectedState);
        expect(newState.isMetricsLoading).toEqual(false);
      });
    });

    it('should return stored metrics when no key is given', () => {
      const metrics = [
        { key: 'filteredOutKey1', children: [] },
        { key: 'filteredOutKey2', children: [] },
        { key: 'keyTest', children: [] },
      ];
      const testCases = [
        {
          expectedState: [
            { key: 'filteredOutKey1', children: [] },
            { key: 'filteredOutKey2', children: [] },
            { key: 'keyTest', children: [] },
          ],
        },
      ];

      testCases.forEach((testCase) => {
        const previousState = { ...initialState };
        previousState.metrics = [
          { key: 'filteredOutKey1', children: [] },
          { key: 'filteredOutKey2', children: [] },
          { key: 'keyTest', children: [] },
        ];
        previousState.isMetricsLoading = true;
        const action = AnalysisActions.actionDeleteMetricSuccess({
          metrics,
        });

        const newState = analysisReducer(previousState, action);

        expect(newState.metrics).toEqual(testCase.expectedState);
        expect(newState.isMetricsLoading).toEqual(false);
      });
    });
  });

  describe('actionUpsertMetricsSuccess', () => {
    it('should merge new metrics with preexisting metrics', () => {
      const previousState = { ...initialState };
      previousState.metrics = [
        { key: 'key1', children: [] },
        { key: 'key2', children: [] },
        { key: 'key3', children: [] },
      ];
      const newMetrics = [
        {
          key: 'key1',
          children: [{ key: 'childKey', children: [] }],
        },
      ];
      previousState.isMetricsLoading = true;
      const action = AnalysisActions.actionUpsertMetricsSuccess({
        metrics: newMetrics,
      });

      const newState = analysisReducer(previousState, action);

      expect(newState.metrics).toEqual([
        {
          key: 'key1',
          children: [{ key: 'childKey', children: [] }],
        },
        { key: 'key2', children: [] },
        { key: 'key3', children: [] },
      ]);
    });

    it('should add new metrics to preexisting metrics', () => {
      const previousState = { ...initialState };
      previousState.metrics = [
        { key: 'key1', children: [] },
        { key: 'key2', children: [] },
        { key: 'key3', children: [] },
      ];
      const newMetrics = [
        {
          key: 'key4',
          children: [{ key: 'childKey', children: [] }],
        },
      ];
      previousState.isMetricsLoading = true;
      const action = AnalysisActions.actionUpsertMetricsSuccess({
        metrics: newMetrics,
      });

      const newState = analysisReducer(previousState, action);

      expect(newState.metrics).toEqual([
        { key: 'key1', children: [] },
        { key: 'key2', children: [] },
        { key: 'key3', children: [] },
        {
          key: 'key4',
          children: [{ key: 'childKey', children: [] }],
        },
      ]);
    });
  });

  it('actionSetMetricsFilterValue should replace filterstring on state', () => {
    const previousState = { ...initialState };
    previousState.metricsFilter = '';
    const filterString = 'test';
    const action = AnalysisActions.actionSetMetricsFilterValue({
      filterString,
    });

    const newState = analysisReducer(previousState, action);

    expect(newState.metricsFilter).toEqual(filterString);
  });

  it('actionExecuteQuery should set isQueryExecuting to true', () => {
    const previousState = { ...initialState };
    previousState.isQueryExecuting = false;

    const action = AnalysisActions.actionExecuteQuery({
      queryIds: [],
    });

    const newState = analysisReducer(previousState, action);

    expect(newState.isQueryExecuting).toEqual(true);
  });

  it('actionExecuteQuerySuccess should set queryResult and isQueryExecuting to false', () => {
    const previousState = { ...initialState };
    previousState.isQueryExecuting = true;
    previousState.queryResult = null;

    const action = AnalysisActions.actionExecuteQuerySuccess({
      queryResult: [],
    });

    const newState = analysisReducer(previousState, action);

    expect(newState.queryResult).toEqual([]);
    expect(newState.isQueryExecuting).toEqual(false);
  });

  it('actionExecuteQueryFailure should set isQueryExecuting to true', () => {
    const previousState = { ...initialState };
    previousState.isQueryExecuting = true;

    const action = AnalysisActions.actionExecuteQueryFailure();

    const newState = analysisReducer(previousState, action);

    expect(newState.isQueryExecuting).toEqual(false);
  });

  it('actionSetQueryResult should set queryResult', () => {
    const previousState = { ...initialState };
    previousState.queryResult = null;

    const action = AnalysisActions.actionSetQueryResult({
      queryResult: [],
    });

    const newState = analysisReducer(previousState, action);

    expect(newState.queryResult).toEqual([]);
  });
});
