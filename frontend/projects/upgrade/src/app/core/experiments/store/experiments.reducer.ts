import {
  ExperimentState,
  Experiment,
  EXPERIMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  EXPERIMENT_SORT_KEY,
} from './experiments.model';
import { createReducer, on, Action } from '@ngrx/store';
import * as experimentsAction from './experiments.actions';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';

export const adapter: EntityAdapter<Experiment> = createEntityAdapter<Experiment>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: ExperimentState = adapter.getInitialState({
  isLoadingExperiment: false,
  isLoadingExperimentDetailStats: false,
  isPollingExperimentDetailStats: false,
  isLoadingExperimentExport: false,
  skipExperiment: 0,
  totalExperiments: null,
  searchKey: EXPERIMENT_SEARCH_KEY.ALL,
  searchString: null,
  sortKey: EXPERIMENT_SORT_KEY.NAME,
  sortAs: SORT_AS_DIRECTION.ASCENDING,
  stats: {},
  graphInfo: null,
  graphRange: null,
  isGraphInfoLoading: false,
  allDecisionPoints: null,
  allExperimentNames: null,
  contextMetaData: {
    contextMetadata: {},
  },
  isLoadingContextMetaData: false,
  currentUserSelectedContext: null,
  isLoadingExperimentDelete: false,
});

const reducer = createReducer(
  initialState,
  on(experimentsAction.actionGetExperiments, (state) => ({
    ...state,
  })),
  on(experimentsAction.actionGetExperimentsSuccess, (state, { experiments, totalExperiments }) => {
    const newState = {
      ...state,
      totalExperiments,
      skipExperiment: state.skipExperiment + experiments.length,
    };
    return adapter.upsertMany(experiments, { ...newState, isLoadingExperiment: false });
  }),
  on(
    experimentsAction.actionGetExperimentsFailure,
    experimentsAction.actionGetExperimentByIdFailure,
    experimentsAction.actionUpsertExperimentFailure,
    (state) => ({ ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionUpsertExperimentSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionFetchExperimentStatsSuccess, (state, { stats }) => {
    const newStats = {};
    stats = Object.keys(stats).map((key) => {
      newStats[key] = { ...state.stats[key], ...stats[key] };
    });
    return { ...state, stats: { ...state.stats, ...newStats }, isLoadingExperimentDetailStats: false };
  }),
  on(experimentsAction.actionSetIsGraphLoading, (state, { isGraphInfoLoading }) => ({ ...state, isGraphInfoLoading })),
  on(experimentsAction.actionFetchExperimentGraphInfo, (state) => ({ ...state, graphInfo: null })),
  on(experimentsAction.actionFetchExperimentGraphInfoSuccess, (state, { graphInfo, range }) => ({
    ...state,
    graphInfo: { ...state.graphInfo, [range]: graphInfo },
    isGraphInfoLoading: false,
  })),
  on(experimentsAction.actionSetExperimentGraphInfo, (state, { graphInfo }) => ({ ...state, graphInfo })),
  on(experimentsAction.actionSetGraphRange, (state, { range }) => ({ ...state, graphRange: range })),
  on(experimentsAction.actionRemoveExperimentStat, (state, { experimentStatId }) => {
    const stats = { ...state.stats };
    delete stats[experimentStatId];
    return { ...state, stats };
  }),
  on(experimentsAction.actionUpsertExperiment, experimentsAction.actionGetExperimentById, (state) => ({
    ...state,
    isLoadingExperiment: true,
    // if we don't have a totalExperiments count yet (no paginated call with > 1 has occured yet),
    // set it to 1 because we are loading at least one experiment so that nav to root page will not show empty template
    totalExperiments: !state.totalExperiments ? 1 : state.totalExperiments,
  })),
  on(experimentsAction.actionGetExperimentByIdSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false })
  ),
  // Experiment Delete Actions
  on(experimentsAction.actionDeleteExperiment, (state) => ({ ...state, isLoadingExperimentDelete: true })),
  on(experimentsAction.actionDeleteExperimentSuccess, (state, { experimentId }) => {
    return adapter.removeOne(experimentId, {
      ...state,
      isLoadingExperimentDelete: false,
    });
  }),
  on(experimentsAction.actionDeleteExperimentFailure, (state) => ({
    ...state,
    isLoadingExperimentDelete: false,
  })),
  on(experimentsAction.actionUpdateExperimentState, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentStateSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionUpdateExperimentFilterMode, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentFilterModeSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionUpdateExperimentDecisionPoints, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentDecisionPointsSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionUpdateExperimentDecisionPointsFailure, (state) => ({
    ...state,
    isLoadingExperiment: false,
  })),
  on(experimentsAction.actionUpdateExperimentConditions, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentConditionsSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionUpdateExperimentConditionsFailure, (state) => ({
    ...state,
    isLoadingExperiment: false,
  })),
  on(experimentsAction.actionUpdateExperimentMetrics, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentMetricsSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionUpdateExperimentMetricsFailure, (state) => ({
    ...state,
    isLoadingExperiment: false,
  })),
  on(experimentsAction.actionFetchAllDecisionPointsSuccess, (state, { decisionPoints }) => ({
    ...state,
    allDecisionPoints: decisionPoints,
  })),
  on(experimentsAction.actionSetIsLoadingExperiment, (state, { isLoadingExperiment }) => ({
    ...state,
    isLoadingExperiment,
  })),
  on(experimentsAction.actionSetSearchKey, (state, { searchKey }) => ({ ...state, searchKey })),
  on(experimentsAction.actionSetSearchString, (state, { searchString }) => ({ ...state, searchString })),
  on(experimentsAction.actionSetSortKey, (state, { sortKey }) => ({ ...state, sortKey })),
  on(experimentsAction.actionSetSortingType, (state, { sortingType }) => ({ ...state, sortAs: sortingType })),
  on(experimentsAction.actionSetSkipExperiment, (state, { skipExperiment }) => ({ ...state, skipExperiment })),
  on(experimentsAction.actionFetchAllExperimentNamesSuccess, (state, { allExperimentNames }) => ({
    ...state,
    allExperimentNames,
  })),
  on(
    experimentsAction.actionFetchContextMetaData,
    experimentsAction.actionFetchContextMetaDataFailure,
    experimentsAction.actionSetIsLoadingContextMetaData,
    (state, { isLoadingContextMetaData }) => ({ ...state, isLoadingContextMetaData })
  ),
  on(experimentsAction.actionFetchContextMetaDataSuccess, (state, { contextMetaData, isLoadingContextMetaData }) => ({
    ...state,
    contextMetaData,
    isLoadingContextMetaData,
  })),
  on(experimentsAction.actionSetCurrentContext, (state, { context }) => ({
    ...state,
    currentUserSelectedContext: state.contextMetaData.contextMetadata[context],
  })),
  on(experimentsAction.actionFetchGroupAssignmentStatusSuccess, (state, { experiment }) =>
    adapter.upsertOne(experiment, state)
  ),
  on(experimentsAction.actionFetchExperimentDetailStat, (state) => ({
    ...state,
    isLoadingExperimentDetailStats: true,
  })),
  on(experimentsAction.actionFetchExperimentDetailStatFailure, (state) => ({
    ...state,
    isLoadingExperimentDetailStats: false,
  })),
  on(experimentsAction.actionFetchExperimentDetailStatSuccess, (state, { stat }) => {
    const stats = { ...state.stats };
    stats[stat.id] = stat;
    return {
      ...state,
      stats,
      isLoadingExperimentDetailStats: false,
    };
  }),
  on(experimentsAction.actionBeginExperimentDetailStatsPolling, (state) => ({
    ...state,
    isPollingExperimentDetailStats: true,
  })),
  on(experimentsAction.actionEndExperimentDetailStatsPolling, (state) => ({
    ...state,
    isPollingExperimentDetailStats: false,
  })),
  on(experimentsAction.actionExportExperimentDesign, (state) => ({
    ...state,
    isLoadingExperimentExport: true,
  })),
  on(experimentsAction.actionExportExperimentDesignSuccess, (state) => ({
    ...state,
    isLoadingExperimentExport: false,
  })),

  // Experiment Inclusion List Add Actions
  on(experimentsAction.actionAddExperimentInclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(experimentsAction.actionAddExperimentInclusionListSuccess, (state, { listResponse }) => {
    const { experiment } = listResponse;
    const existingExperiment = state.entities[experiment?.id];

    return adapter.updateOne(
      {
        id: experiment?.id,
        changes: { experimentSegmentInclusion: [listResponse, ...existingExperiment.experimentSegmentInclusion] },
      },
      { ...state }
    );
  }),
  on(experimentsAction.actionAddExperimentInclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),

  // Experiment Inclusion List Update Actions
  on(experimentsAction.actionUpdateExperimentInclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(experimentsAction.actionUpdateExperimentInclusionListSuccess, (state, { listResponse }) => {
    const { experiment } = listResponse;
    const existingExperiment = state.entities[experiment?.id];

    if (existingExperiment) {
      const updatedInclusions =
        existingExperiment.experimentSegmentInclusion?.map((inclusion) =>
          inclusion.segment.id === listResponse.segment.id ? listResponse : inclusion
        ) ?? [];

      return adapter.updateOne(
        {
          id: experiment?.id,
          changes: { experimentSegmentInclusion: updatedInclusions },
        },
        { ...state, isLoadingUpsertPrivateSegmentList: false }
      );
    }
    return state;
  }),
  on(experimentsAction.actionUpdateExperimentInclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),

  // Experiment Inclusion List Delete Actions
  on(experimentsAction.actionDeleteExperimentInclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(experimentsAction.actionDeleteExperimentInclusionListSuccess, (state, { segmentId }) => {
    const updatedState = { ...state, isLoadingUpsertPrivateSegmentList: false };
    const experimentId = Object.keys(state.entities).find((id) =>
      state.entities[id].experimentSegmentInclusion?.some((inclusion) => inclusion.segment?.id === segmentId)
    );

    if (experimentId) {
      const experiment = state.entities[experimentId];
      const updatedInclusions =
        experiment.experimentSegmentInclusion?.filter((inclusion) => inclusion.segment.id !== segmentId) ?? [];

      return adapter.updateOne(
        {
          id: experiment.id,
          changes: { experimentSegmentInclusion: updatedInclusions },
        },
        updatedState
      );
    }

    return updatedState;
  }),
  on(experimentsAction.actionDeleteExperimentInclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),

  // Experiment Exclusion List Add Actions
  on(experimentsAction.actionAddExperimentExclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(experimentsAction.actionAddExperimentExclusionListSuccess, (state, { listResponse }) => {
    const { experiment } = listResponse;
    const existingExperiment = state.entities[experiment?.id];

    return adapter.updateOne(
      {
        id: experiment?.id,
        changes: { experimentSegmentExclusion: [listResponse, ...existingExperiment.experimentSegmentExclusion] },
      },
      { ...state }
    );
  }),
  on(experimentsAction.actionAddExperimentExclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),

  // Experiment Exclusion List Update Actions
  on(experimentsAction.actionUpdateExperimentExclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(experimentsAction.actionUpdateExperimentExclusionListSuccess, (state, { listResponse }) => {
    const { experiment } = listResponse;
    const existingExperiment = state.entities[experiment?.id];

    if (existingExperiment) {
      const updatedExclusions =
        existingExperiment.experimentSegmentExclusion?.map((exclusion) =>
          exclusion.segment.id === listResponse.segment.id ? listResponse : exclusion
        ) ?? [];

      return adapter.updateOne(
        {
          id: experiment?.id,
          changes: { experimentSegmentExclusion: updatedExclusions },
        },
        { ...state, isLoadingUpsertPrivateSegmentList: false }
      );
    }
    return state;
  }),
  on(experimentsAction.actionUpdateExperimentExclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),

  // Experiment Exclusion List Delete Actions
  on(experimentsAction.actionDeleteExperimentExclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(experimentsAction.actionDeleteExperimentExclusionListSuccess, (state, { segmentId }) => {
    const updatedState = { ...state, isLoadingUpsertPrivateSegmentList: false };
    const experimentId = Object.keys(state.entities).find((id) =>
      state.entities[id].experimentSegmentExclusion?.some((exclusion) => exclusion.segment?.id === segmentId)
    );

    if (experimentId) {
      const experiment = state.entities[experimentId];
      const updatedExclusions =
        experiment.experimentSegmentExclusion?.filter((exclusion) => exclusion.segment.id !== segmentId) ?? [];

      return adapter.updateOne(
        {
          id: experiment.id,
          changes: { experimentSegmentExclusion: updatedExclusions },
        },
        updatedState
      );
    }

    return updatedState;
  }),
  on(experimentsAction.actionDeleteExperimentExclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),
  on(experimentsAction.actionSetIsLoadingImportExperiment, (state, { isLoadingImportExperiment }) => ({
    ...state,
    isLoadingImportExperiment,
  }))
);

export function experimentsReducer(state: ExperimentState | undefined, action: Action) {
  return reducer(state, action);
}
