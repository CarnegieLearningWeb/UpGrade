import { ExperimentState, EXPERIMENT_SEARCH_KEY, SORT_AS_DIRECTION, EXPERIMENT_SORT_KEY } from './experiments.model';
import { createReducer, on, Action } from '@ngrx/store';
import * as experimentsAction from './experiments.actions';

export const initialState: ExperimentState = {
  // List page state
  experiments: [],
  isLoadingExperiment: false,
  hasInitialExperimentsDataLoaded: false,
  isLoadingExperimentDetailStats: false,
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
  isLoadingImportExperiment: false,
  isLoadingRewardsSummary: false,
  rewardsSummaries: {},
  isLoadingUpsertPrivateSegmentList: false,
};

const reducer = createReducer(
  initialState,
  on(experimentsAction.actionGetExperiments, (state) => ({
    ...state,
  })),
  on(experimentsAction.actionGetExperimentsSuccess, (state, { experiments, totalExperiments, fromStarting }) => {
    // Replace entire array with backend data - preserves exact sort order
    const updatedExperiments = fromStarting
      ? experiments // First fetch - use backend data directly
      : [...state.experiments, ...experiments]; // Pagination - append to existing

    return {
      ...state,
      experiments: updatedExperiments,
      totalExperiments,
      skipExperiment: fromStarting ? experiments.length : state.skipExperiment + experiments.length,
      isLoadingExperiment: false,
      hasInitialExperimentsDataLoaded: true,
    };
  }),
  on(
    experimentsAction.actionGetExperimentsFailure,
    experimentsAction.actionGetExperimentByIdFailure,
    experimentsAction.actionUpsertExperimentFailure,
    experimentsAction.actionUpdateExperimentFilterModeFailure,
    experimentsAction.actionUpdateExperimentStateFailure,
    (state) => ({ ...state, isLoadingExperiment: false })
  ),
  on(experimentsAction.actionUpsertExperimentSuccess, (state, { experiment }) => {
    // Update experiment if it exists, otherwise don't add to list (let refetch handle it)
    const updatedExperiments = state.experiments.map((exp) => (exp.id === experiment.id ? experiment : exp));

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperiment: false,
    };
  }),
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
    // If the total count is unknown, assume at least one experiment is loading so the root page skips the empty state.
    // Preserve 0 because it means the backend already confirmed an empty list.
    totalExperiments: state.totalExperiments ?? 1,
  })),
  on(experimentsAction.actionGetExperimentByIdSuccess, (state, { experiment }) => {
    // Upsert experiment: update if exists, add if not (for direct navigation)
    const existingIndex = state.experiments.findIndex((exp) => exp.id === experiment.id);
    let updatedExperiments;
    if (existingIndex >= 0) {
      // Update existing experiment
      updatedExperiments = [...state.experiments];
      updatedExperiments[existingIndex] = experiment;
    } else {
      // Add new experiment (for direct navigation to detail page)
      updatedExperiments = [experiment, ...state.experiments];
    }

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperiment: false,
    };
  }),
  // Experiment Delete Actions
  on(experimentsAction.actionDeleteExperiment, (state) => ({ ...state, isLoadingExperimentDelete: true })),
  on(experimentsAction.actionDeleteExperimentSuccess, (state, { experimentId }) => {
    const updatedExperiments = state.experiments.filter((exp) => exp.id !== experimentId);

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperimentDelete: false,
    };
  }),
  on(experimentsAction.actionDeleteExperimentFailure, (state) => ({
    ...state,
    isLoadingExperimentDelete: false,
  })),
  on(experimentsAction.actionUpdateExperimentState, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentStateSuccess, (state, { experiment }) => {
    const updatedExperiments = state.experiments.map((exp) => (exp.id === experiment.id ? experiment : exp));

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperiment: false,
    };
  }),
  on(experimentsAction.actionUpdateExperimentFilterMode, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentFilterModeSuccess, (state, { experiment }) => {
    const updatedExperiments = state.experiments.map((exp) => (exp.id === experiment.id ? experiment : exp));

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperiment: false,
    };
  }),
  on(experimentsAction.actionUpdateExperimentDecisionPoints, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentDecisionPointsSuccess, (state, { experiment }) => {
    const updatedExperiments = state.experiments.map((exp) => (exp.id === experiment.id ? experiment : exp));

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperiment: false,
    };
  }),
  on(experimentsAction.actionUpdateExperimentDecisionPointsFailure, (state) => ({
    ...state,
    isLoadingExperiment: false,
  })),
  on(experimentsAction.actionUpdateExperimentConditions, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentConditionsSuccess, (state, { experiment }) => {
    const updatedExperiments = state.experiments.map((exp) => (exp.id === experiment.id ? experiment : exp));

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperiment: false,
    };
  }),
  on(experimentsAction.actionUpdateExperimentConditionsFailure, (state) => ({
    ...state,
    isLoadingExperiment: false,
  })),
  on(experimentsAction.actionUpdateExperimentMetrics, (state) => ({ ...state, isLoadingExperiment: true })),
  on(experimentsAction.actionUpdateExperimentMetricsSuccess, (state, { experiment }) => {
    const updatedExperiments = state.experiments.map((exp) => (exp.id === experiment.id ? experiment : exp));

    return {
      ...state,
      experiments: updatedExperiments,
      isLoadingExperiment: false,
    };
  }),
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
    const existingExperimentIndex = state.experiments.findIndex((exp) => exp.id === experiment?.id);

    if (existingExperimentIndex >= 0) {
      const existingExperiment = state.experiments[existingExperimentIndex];
      const updatedExperiments = [...state.experiments];
      updatedExperiments[existingExperimentIndex] = {
        ...existingExperiment,
        experimentSegmentInclusion: [listResponse, ...existingExperiment.experimentSegmentInclusion],
      };

      return {
        ...state,
        experiments: updatedExperiments,
        isLoadingUpsertPrivateSegmentList: false,
      };
    }

    return {
      ...state,
      isLoadingUpsertPrivateSegmentList: false,
    };
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
    const existingExperimentIndex = state.experiments.findIndex((exp) => exp.id === experiment?.id);

    if (existingExperimentIndex >= 0) {
      const existingExperiment = state.experiments[existingExperimentIndex];
      const updatedInclusionList = existingExperiment.experimentSegmentInclusion.map((item) =>
        item.segment?.id === listResponse.segment?.id ? listResponse : item
      );

      const updatedExperiments = [...state.experiments];
      updatedExperiments[existingExperimentIndex] = {
        ...existingExperiment,
        experimentSegmentInclusion: updatedInclusionList,
      };

      return {
        ...state,
        experiments: updatedExperiments,
        isLoadingUpsertPrivateSegmentList: false,
      };
    }

    return {
      ...state,
      isLoadingUpsertPrivateSegmentList: false,
    };
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
    // Find the experiment that contains this segment in its inclusion list
    const existingExperimentIndex = state.experiments.findIndex((exp) =>
      exp.experimentSegmentInclusion?.some((item) => item.segment?.id === segmentId)
    );

    if (existingExperimentIndex >= 0) {
      const existingExperiment = state.experiments[existingExperimentIndex];
      const updatedInclusionList = existingExperiment.experimentSegmentInclusion.filter(
        (item) => item.segment?.id !== segmentId
      );

      const updatedExperiments = [...state.experiments];
      updatedExperiments[existingExperimentIndex] = {
        ...existingExperiment,
        experimentSegmentInclusion: updatedInclusionList,
      };

      return {
        ...state,
        experiments: updatedExperiments,
        isLoadingUpsertPrivateSegmentList: false,
      };
    }

    return {
      ...state,
      isLoadingUpsertPrivateSegmentList: false,
    };
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
    const existingExperimentIndex = state.experiments.findIndex((exp) => exp.id === experiment?.id);

    if (existingExperimentIndex >= 0) {
      const existingExperiment = state.experiments[existingExperimentIndex];
      const updatedExperiments = [...state.experiments];
      updatedExperiments[existingExperimentIndex] = {
        ...existingExperiment,
        experimentSegmentExclusion: [listResponse, ...existingExperiment.experimentSegmentExclusion],
      };

      return {
        ...state,
        experiments: updatedExperiments,
        isLoadingUpsertPrivateSegmentList: false,
      };
    }

    return {
      ...state,
      isLoadingUpsertPrivateSegmentList: false,
    };
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
    const existingExperimentIndex = state.experiments.findIndex((exp) => exp.id === experiment?.id);

    if (existingExperimentIndex >= 0) {
      const existingExperiment = state.experiments[existingExperimentIndex];
      const updatedExclusionList = existingExperiment.experimentSegmentExclusion.map((item) =>
        item.segment?.id === listResponse.segment?.id ? listResponse : item
      );

      const updatedExperiments = [...state.experiments];
      updatedExperiments[existingExperimentIndex] = {
        ...existingExperiment,
        experimentSegmentExclusion: updatedExclusionList,
      };

      return {
        ...state,
        experiments: updatedExperiments,
        isLoadingUpsertPrivateSegmentList: false,
      };
    }

    return {
      ...state,
      isLoadingUpsertPrivateSegmentList: false,
    };
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
    // Find the experiment that contains this segment in its exclusion list
    const existingExperimentIndex = state.experiments.findIndex((exp) =>
      exp.experimentSegmentExclusion?.some((item) => item.segment?.id === segmentId)
    );

    if (existingExperimentIndex >= 0) {
      const existingExperiment = state.experiments[existingExperimentIndex];
      const updatedExclusionList = existingExperiment.experimentSegmentExclusion.filter(
        (item) => item.segment?.id !== segmentId
      );

      const updatedExperiments = [...state.experiments];
      updatedExperiments[existingExperimentIndex] = {
        ...existingExperiment,
        experimentSegmentExclusion: updatedExclusionList,
      };

      return {
        ...state,
        experiments: updatedExperiments,
        isLoadingUpsertPrivateSegmentList: false,
      };
    }

    return {
      ...state,
      isLoadingUpsertPrivateSegmentList: false,
    };
  }),
  on(experimentsAction.actionDeleteExperimentExclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),
  on(experimentsAction.actionSetIsLoadingImportExperiment, (state, { isLoadingImportExperiment }) => ({
    ...state,
    isLoadingImportExperiment,
  })),
  on(experimentsAction.actionFetchRewardsDataForExperiment, (state) => ({
    ...state,
    isLoadingRewardsSummary: true,
  })),
  on(
    experimentsAction.actionFetchRewardsDataForExperimentSuccess,
    (state, { experimentId, rewardsSummary }): ExperimentState => {
      return {
        ...state,
        isLoadingRewardsSummary: false,
        rewardsSummaries: {
          ...state.rewardsSummaries,
          [experimentId]: rewardsSummary,
        },
      };
    }
  ),
  on(experimentsAction.actionFetchRewardsDataForExperimentFailure, (state) => ({
    ...state,
    isLoadingRewardsSummary: false,
  }))
);

export function experimentsReducer(state: ExperimentState | undefined, action: Action) {
  return reducer(state, action);
}
