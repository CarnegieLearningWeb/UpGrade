import { initialState, experimentsReducer } from './experiments.reducer';
import { Action } from '@ngrx/store';
import {
  actionBeginExperimentDetailStatsPolling,
  actionDeleteExperimentSuccess,
  actionEndExperimentDetailStatsPolling,
  actionFetchAllExperimentNamesSuccess,
  actionFetchAllDecisionPointsSuccess,
  actionFetchContextMetaDataSuccess,
  actionFetchExperimentDetailStat,
  actionFetchExperimentDetailStatFailure,
  actionFetchExperimentDetailStatSuccess,
  actionFetchExperimentGraphInfo,
  actionFetchExperimentGraphInfoSuccess,
  actionFetchExperimentStatsSuccess,
  actionGetExperimentById,
  actionGetExperimentByIdFailure,
  actionGetExperimentByIdSuccess,
  actionGetExperiments,
  actionGetExperimentsFailure,
  actionGetExperimentsSuccess,
  actionRemoveExperimentStat,
  actionSetExperimentGraphInfo,
  actionSetGraphRange,
  actionSetIsGraphLoading,
  actionSetIsLoadingExperiment,
  actionSetSearchKey,
  actionSetSearchString,
  actionSetSkipExperiment,
  actionSetSortingType,
  actionSetSortKey,
  actionUpdateExperimentState,
  actionUpdateExperimentStateSuccess,
  actionUpsertExperiment,
  actionUpsertExperimentFailure,
  actionUpsertExperimentSuccess,
} from './experiments.actions';
import {
  DATE_RANGE,
  ExperimentState,
  ExperimentVM,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
  UpsertExperimentType,
} from './experiments.model';

describe('ExperimentsReducer', () => {
  it('should not affect state if no action is recognized', () => {
    const previousState = { ...initialState };
    const testAction: Action = {
      type: 'test',
    };

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).toBe(previousState);
    expect(newState).toEqual(previousState);
  });

  it('action "actionGetExperiments" should return same copy of state', () => {
    const previousState = { ...initialState };
    const testAction: Action = actionGetExperiments({});

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual(previousState);
  });

  it('action "actionGetExperimentsSuccess" should set state with new experiments and reset loading', () => {
    const previousState: ExperimentState = {
      ...initialState,
      entities: null,
      isLoadingExperiment: true,
      totalExperiments: 0,
      skipExperiment: 0,
    };

    const testProps = {
      experiments: [
        {
          id: '1',
        } as ExperimentVM,
      ],
      totalExperiments: 1,
    };

    const testAction: Action = actionGetExperimentsSuccess(testProps);

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      entities: {
        '1': {
          id: '1',
        },
      },
      ids: ['1'],
      totalExperiments: 1,
      skipExperiment: 1,
      isLoadingExperiment: false,
    });
  });

  it('action "actionGetExperimentsFailure" should set loading to false', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = true;
    const testAction: Action = actionGetExperimentsFailure({ error: 'test' });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperiment).toEqual(false);
  });

  it('action "actionGetExperimentByIdFailure" should set loading to false', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = true;
    const testAction: Action = actionGetExperimentByIdFailure();

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperiment).toEqual(false);
  });

  it('action "actionUpsertExperimentFailure" should set loading to false', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = true;
    const testAction: Action = actionUpsertExperimentFailure();

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperiment).toEqual(false);
  });

  it('action "actionUpsertExperimentSuccess" should set loading to false and set new experiment', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = true;
    const testAction: Action = actionUpsertExperimentSuccess({
      experiment: {
        id: '1',
      } as ExperimentVM,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      isLoadingExperiment: false,
      entities: {
        '1': {
          id: '1',
        },
      },
      ids: ['1'],
    });
  });

  it('action "actionFetchExperimentStatsSuccess" should set detail stats and loading reset', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperimentDetailStats = true;
    const testAction: Action = actionFetchExperimentStatsSuccess({
      stats: {
        '1': {
          id: '1',
          users: 10,
        },
      },
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      isLoadingExperimentDetailStats: false,
      stats: {
        '1': {
          id: '1',
          users: 10,
        },
      },
    });
  });

  it('action "actionSetIsGraphLoading" should set graph loading per the input', () => {
    const previousState = { ...initialState };
    previousState.isGraphInfoLoading = false;
    const testAction: Action = actionSetIsGraphLoading({ isGraphInfoLoading: true });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isGraphInfoLoading).toEqual(true);
  });

  it('action "actionFetchExperimentGraphInfo" should set graphInfo property', () => {
    const previousState = { ...initialState };
    previousState.graphInfo = {
      [DATE_RANGE.LAST_SEVEN_DAYS]: [],
      [DATE_RANGE.LAST_THREE_MONTHS]: [],
      [DATE_RANGE.LAST_SIX_MONTHS]: [],
      [DATE_RANGE.LAST_TWELVE_MONTHS]: [],
    };
    const testAction: Action = actionFetchExperimentGraphInfo({
      experimentId: '1',
      range: DATE_RANGE.LAST_SEVEN_DAYS,
      clientOffset: 200,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.graphInfo).toEqual(null);
  });

  it('action "actionFetchExperimentGraphInfoSuccess" should set graph info and loading to false', () => {
    const previousState = { ...initialState };
    previousState.isGraphInfoLoading = true;
    previousState.graphInfo = null;
    const testAction: Action = actionFetchExperimentGraphInfoSuccess({
      range: DATE_RANGE.LAST_SEVEN_DAYS,
      graphInfo: [
        {
          date: '1234',
          stats: {
            id: '3',
            conditions: [
              {
                id: '1',
                partitions: [
                  {
                    id: '2',
                    users: 10,
                    groups: 2,
                  },
                ],
              },
            ],
          },
        },
      ],
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      isGraphInfoLoading: false,
      graphInfo: {
        ...previousState.graphInfo,
        [DATE_RANGE.LAST_SEVEN_DAYS]: [
          {
            date: '1234',
            stats: {
              id: '3',
              conditions: [
                {
                  id: '1',
                  partitions: [
                    {
                      id: '2',
                      users: 10,
                      groups: 2,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    });
  });

  it('action "actionSetExperimentGraphInfo" should set graph info', () => {
    const previousState = { ...initialState };
    previousState.graphInfo = null;
    const testAction: Action = actionSetExperimentGraphInfo({
      graphInfo: [
        {
          date: '1234',
          stats: {
            id: '3',
            conditions: [
              {
                id: '1',
                partitions: [
                  {
                    id: '2',
                    users: 10,
                    groups: 2,
                  },
                ],
              },
            ],
          },
        },
      ],
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      graphInfo: [
        {
          date: '1234',
          stats: {
            id: '3',
            conditions: [
              {
                id: '1',
                partitions: [
                  {
                    id: '2',
                    users: 10,
                    groups: 2,
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  });

  it('action "actionSetGraphRange" should set graph range selected', () => {
    const previousState = { ...initialState };
    const testAction: Action = actionSetGraphRange({
      experimentId: '1',
      range: DATE_RANGE.LAST_SEVEN_DAYS,
      clientOffset: 200,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.graphRange).toEqual(DATE_RANGE.LAST_SEVEN_DAYS);
  });

  it('action "actionRemoveExperimentStat" should remove the stat by id', () => {
    const previousState = { ...initialState };
    previousState.stats['1'] = {
      id: '1',
      users: 10,
      groups: 2,
      usersExcluded: 1,
      groupsExcluded: 1,
      conditions: [],
    };
    const testAction: Action = actionRemoveExperimentStat({
      experimentStatId: '1',
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.stats['1']).toBeUndefined();
  });

  it('action "actionUpsertExperiment" should set loading to true', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = false;

    const testAction: Action = actionUpsertExperiment({
      experiment: {
        id: '1',
      } as any,
      actionType: UpsertExperimentType.CREATE_NEW_EXPERIMENT,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperiment).toEqual(true);
  });

  it('action "actionGetExperimentById" should set loading to true', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = false;

    const testAction: Action = actionGetExperimentById({
      experimentId: '1',
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperiment).toEqual(true);
  });

  it('action "actionGetExperimentByIdSuccess" should set loading to false and set experiment details', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = true;

    const testAction: Action = actionGetExperimentByIdSuccess({
      experiment: {
        id: '1',
      } as any,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      isLoadingExperiment: false,
      entities: {
        '1': {
          id: '1',
        },
      },
      ids: ['1'],
    });
  });

  it('action "actionDeleteExperimentSuccess" should remove experiment by id', () => {
    const previousState = { ...initialState };
    previousState.entities = {
      '1': {
        id: '1',
      } as ExperimentVM,
    };
    previousState.ids = ['1'];

    const testAction: Action = actionDeleteExperimentSuccess({
      experimentId: '1',
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      entities: {},
      ids: [],
    });
  });

  it('action "actionUpdateExperimentState" should set loading to true', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = false;

    const testAction: Action = actionUpdateExperimentState({
      experimentId: '1',
      experimentStateInfo: null,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperiment).toEqual(true);
  });

  it('action "actionUpdateExperimentStateSuccess" should set loading to false and set experiment', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = false;

    const testAction: Action = actionUpdateExperimentStateSuccess({
      experiment: {
        id: '1',
      } as any,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual({
      ...previousState,
      isLoadingExperiment: false,
      entities: {
        '1': {
          id: '1',
        },
      },
      ids: ['1'],
    });
  });

  it('action "actionFetchAllDecisionPointsSuccess" should set decisionPoints', () => {
    const previousState = { ...initialState };
    previousState.allDecisionPoints = {};

    const testAction: Action = actionFetchAllDecisionPointsSuccess({
      decisionPoints: ['test'],
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.allDecisionPoints).toEqual(['test']);
  });

  it('action "actionSetIsLoadingExperiment" should set loading to true', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperiment = false;

    const testAction: Action = actionSetIsLoadingExperiment({
      isLoadingExperiment: true,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperiment).toEqual(true);
  });

  it('action "actionSetSearchKey" should set search key', () => {
    const previousState = { ...initialState };
    previousState.searchKey = EXPERIMENT_SEARCH_KEY.CONTEXT;

    const testAction: Action = actionSetSearchKey({
      searchKey: EXPERIMENT_SEARCH_KEY.ALL,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.searchKey).toEqual(EXPERIMENT_SEARCH_KEY.ALL);
  });

  it('action "actionSetSearchString" should set search string', () => {
    const previousState = { ...initialState };
    previousState.searchString = '';

    const testAction: Action = actionSetSearchString({
      searchString: 'test',
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.searchString).toEqual('test');
  });

  it('action "actionSetSortKey" should set sort key', () => {
    const previousState = { ...initialState };
    previousState.sortKey = EXPERIMENT_SORT_KEY.NAME;

    const testAction: Action = actionSetSortKey({
      sortKey: EXPERIMENT_SORT_KEY.CREATED_AT,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.sortKey).toEqual(EXPERIMENT_SORT_KEY.CREATED_AT);
  });

  it('action "actionSetSortingType" should set sort-as', () => {
    const previousState = { ...initialState };
    previousState.sortAs = EXPERIMENT_SORT_AS.DESCENDING;

    const testAction: Action = actionSetSortingType({
      sortingType: EXPERIMENT_SORT_AS.ASCENDING,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.sortAs).toEqual(EXPERIMENT_SORT_AS.ASCENDING);
  });

  it('action "actionSetSkipExperiment" should set experiment skip value', () => {
    const previousState = { ...initialState };
    previousState.skipExperiment = 2;

    const testAction: Action = actionSetSkipExperiment({
      skipExperiment: 3,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.skipExperiment).toEqual(3);
  });

  it('action "actionFetchAllExperimentNamesSuccess" should set all experimet names', () => {
    const previousState = { ...initialState };
    previousState.allExperimentNames = [];

    const testAction: Action = actionFetchAllExperimentNamesSuccess({
      allExperimentNames: [
        {
          id: '1',
          name: 'test',
        },
      ],
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.allExperimentNames).toEqual([
      {
        id: '1',
        name: 'test',
      },
    ]);
  });

  it('action "actionFetchContextMetaDataSuccess" should set context meta data', () => {
    const previousState = { ...initialState };
    previousState.contextMetaData = null;

    const testAction: Action = actionFetchContextMetaDataSuccess({
      contextMetaData: {
        contextMetadata: null,
      },
      isLoadingContextMetaData: false,
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.contextMetaData).toEqual({
      contextMetadata: null,
    });
  });

  it('action "actionFetchExperimentDetailStat" should set loading to true', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperimentDetailStats = false;

    const testAction: Action = actionFetchExperimentDetailStat({
      experimentId: '1',
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperimentDetailStats).toEqual(true);
  });

  it('action "actionFetchExperimentDetailStatFailure" should set loading to false', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperimentDetailStats = true;

    const testAction: Action = actionFetchExperimentDetailStatFailure();

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperimentDetailStats).toEqual(false);
  });

  it('action "actionFetchExperimentDetailStatSuccess" should set details', () => {
    const previousState = { ...initialState };
    previousState.isLoadingExperimentDetailStats = true;
    previousState.stats['1'] = {
      id: '1',
      users: 10,
      groups: 2,
      usersExcluded: 1,
      groupsExcluded: 1,
      conditions: [],
    };

    const testAction: Action = actionFetchExperimentDetailStatSuccess({
      stat: {
        id: '1',
        users: 11,
        groups: 2,
        usersExcluded: 1,
        groupsExcluded: 1,
        conditions: [],
      },
    });

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.stats['1'].users).toEqual(11);
  });

  it('action "actionBeginExperimentDetailStatsPolling" should set polling to true', () => {
    const previousState = { ...initialState };
    previousState.isPollingExperimentDetailStats = false;

    const testAction: Action = actionBeginExperimentDetailStatsPolling({} as any);

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isPollingExperimentDetailStats).toEqual(true);
  });

  it('action "actionEndExperimentDetailStatsPolling" should set polling to false', () => {
    const previousState = { ...initialState };
    previousState.isPollingExperimentDetailStats = true;

    const testAction: Action = actionEndExperimentDetailStatsPolling();

    const newState = experimentsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState.isLoadingExperimentDetailStats).toEqual(false);
  });
});
