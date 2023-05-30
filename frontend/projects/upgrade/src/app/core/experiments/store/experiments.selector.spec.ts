import { EXPERIMENT_TYPE, FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import {
  ExperimentState,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
  DATE_RANGE,
  EXPERIMENT_STATE,
  POST_EXPERIMENT_RULE,
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  CONDITION_ORDER,
} from './experiments.model';
import { initialState } from './experiments.reducer';
import {
  selectAllExperiment,
  selectAllExperimentNames,
  selectAllDecisionPoints,
  selectContextMetaData,
  selectExperimentById,
  selectExperimentGraphInfo,
  selectExperimentGraphRange,
  selectExperimentStatById,
  selectExperimentState,
  selectExperimentStats,
  selectIsGraphLoading,
  selectIsLoadingExperiment,
  selectIsLoadingExperimentDetailStats,
  selectIsPollingExperimentDetailStats,
  selectSearchKey,
  selectSearchString,
  selectSelectedExperiment,
  selectSkipExperiment,
  selectSortAs,
  selectSortKey,
  selectTotalExperiment,
} from './experiments.selectors';

describe('Experiments Selectors', () => {
  const mockState: ExperimentState = {
    ...initialState,
    ids: ['1f12cd8f-7ff9-4731-a4eb-7104918ed252'],
    entities: {
      '1f12cd8f-7ff9-4731-a4eb-7104918ed252': {
        createdAt: '2022-05-20T15:58:36.602Z',
        updatedAt: '2022-05-20T17:40:13.685Z',
        versionNumber: 7,
        id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
        name: 'is it cake',
        description: '',
        context: ['testexcludeinclude'],
        state: EXPERIMENT_STATE.ENROLLING,
        startOn: null,
        consistencyRule: CONSISTENCY_RULE.GROUP,
        assignmentUnit: ASSIGNMENT_UNIT.GROUP,
        conditionOrder: CONDITION_ORDER.RANDOM,
        postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
        enrollmentCompleteCondition: null,
        endOn: null,
        revertTo: null,
        tags: [],
        group: 'schoolId',
        logging: false,
        filterMode: FILTER_MODE.INCLUDE_ALL,
        backendVersion: '1.0.0',
        experimentSegmentInclusion: {
          updatedAt: '2022-06-20T13:14:52.900Z',
          createdAt: '2022-06-20T13:14:52.900Z',
          versionNumber: 1,
          segment: {
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
          },
        },
        experimentSegmentExclusion: {
          updatedAt: '2022-06-20T13:14:52.900Z',
          createdAt: '2022-06-20T13:14:52.900Z',
          versionNumber: 1,
          segment: {
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
          },
        },
        conditions: [
          {
            createdAt: '2022-04-05T21:22:16.770Z',
            updatedAt: '2022-04-05T21:22:16.770Z',
            versionNumber: 1,
            id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
            twoCharacterId: '98',
            name: '',
            description: null,
            conditionCode: 'control',
            assignmentWeight: 50,
            order: 1,
          },
          {
            createdAt: '2022-04-05T21:22:16.770Z',
            updatedAt: '2022-04-05T21:22:16.770Z',
            versionNumber: 1,
            id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
            twoCharacterId: '9A',
            name: '',
            description: null,
            conditionCode: 'variant',
            assignmentWeight: 50,
            order: 2,
          },
        ],
        partitions: [
          {
            createdAt: '2022-04-05T21:22:16.770Z',
            updatedAt: '2022-04-05T21:22:16.770Z',
            versionNumber: 1,
            id: 'is-it-cake_SelectSection',
            twoCharacterId: '17',
            site: 'SelectSection',
            target: 'is-it-cake',
            description: '',
            order: 1,
            excludeIfReached: false,
          },
        ],
        factors: [],
        conditionPayloads: [],
        queries: [],
        stateTimeLogs: [
          {
            createdAt: '2022-05-20T16:08:03.209Z',
            updatedAt: '2022-05-20T16:08:03.209Z',
            versionNumber: 1,
            id: 'df19838f-f685-43c7-b288-c4a91ca4b571',
            fromState: EXPERIMENT_STATE.INACTIVE,
            toState: EXPERIMENT_STATE.ENROLLING,
            timeLog: '2022-05-20T16:08:03.200Z',
          },
          {
            createdAt: '2022-05-20T16:09:26.509Z',
            updatedAt: '2022-05-20T16:09:26.509Z',
            versionNumber: 1,
            id: '87f51b23-b7a3-40e4-b0b8-d28fbfb548ab',
            fromState: EXPERIMENT_STATE.ENROLLING,
            toState: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
            timeLog: '2022-05-20T16:09:26.504Z',
          },
          {
            createdAt: '2022-05-20T16:30:57.584Z',
            updatedAt: '2022-05-20T16:30:57.584Z',
            versionNumber: 1,
            id: '523166ae-e5fa-444d-a3a0-6ec2bf50a9dd',
            fromState: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
            toState: EXPERIMENT_STATE.ENROLLING,
            timeLog: '2022-05-20T16:30:57.576Z',
          },
          {
            createdAt: '2022-05-20T16:35:55.582Z',
            updatedAt: '2022-05-20T16:35:55.582Z',
            versionNumber: 1,
            id: '56028969-37ea-4981-8d1d-0436b48ffc98',
            fromState: EXPERIMENT_STATE.ENROLLING,
            toState: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
            timeLog: '2022-05-20T16:35:55.573Z',
          },
          {
            createdAt: '2022-05-20T17:33:21.328Z',
            updatedAt: '2022-05-20T17:33:21.328Z',
            versionNumber: 1,
            id: '6249f7d0-81c9-4995-bedd-8acd34dfa5db',
            fromState: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
            toState: EXPERIMENT_STATE.ENROLLING,
            timeLog: '2022-05-20T17:33:21.322Z',
          },
          {
            createdAt: '2022-05-20T17:40:13.688Z',
            updatedAt: '2022-05-20T17:40:13.688Z',
            versionNumber: 1,
            id: '49e7cebb-f43e-450b-bf7c-d23cd73c32f7',
            fromState: EXPERIMENT_STATE.ENROLLING,
            toState: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
            timeLog: '2022-05-20T17:40:13.682Z',
          },
        ],
        type: EXPERIMENT_TYPE.SIMPLE,
      },
    },
    isLoadingExperiment: false,
    isLoadingExperimentDetailStats: false,
    isPollingExperimentDetailStats: false,
    skipExperiment: 0,
    totalExperiments: null,
    searchKey: null,
    searchString: null,
    sortKey: EXPERIMENT_SORT_KEY.NAME,
    sortAs: EXPERIMENT_SORT_AS.ASCENDING,
    stats: {
      '1f12cd8f-7ff9-4731-a4eb-7104918ed252': {
        id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
        users: 7,
        groups: 7,
        usersExcluded: 6,
        groupsExcluded: 6,
        conditions: [
          {
            id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
            users: 3,
            groups: 3,
            partitions: [
              {
                id: 'is-it-cake_SelectSection',
                users: 3,
                groups: 3,
              },
            ],
          },
          {
            id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
            users: 4,
            groups: 4,
            partitions: [
              {
                id: 'is-it-cake_SelectSection',
                users: 4,
                groups: 4,
              },
            ],
          },
        ],
      },
    },
    graphInfo: {
      [DATE_RANGE.LAST_SEVEN_DAYS]: [
        {
          date: 'Wed May 18 2022',
          stats: {
            id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
            conditions: [
              {
                id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
              {
                id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
            ],
          },
        },
        {
          date: 'Thu May 19 2022',
          stats: {
            id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
            conditions: [
              {
                id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
              {
                id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
            ],
          },
        },
        {
          date: 'Fri May 20 2022',
          stats: {
            id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
            conditions: [
              {
                id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 3,
                    groups: 3,
                  },
                ],
              },
              {
                id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 4,
                    groups: 4,
                  },
                ],
              },
            ],
          },
        },
        {
          date: 'Sat May 21 2022',
          stats: {
            id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
            conditions: [
              {
                id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
              {
                id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
            ],
          },
        },
        {
          date: 'Sun May 22 2022',
          stats: {
            id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
            conditions: [
              {
                id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
              {
                id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
            ],
          },
        },
        {
          date: 'Mon May 23 2022',
          stats: {
            id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
            conditions: [
              {
                id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
              {
                id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
            ],
          },
        },
        {
          date: 'Tue May 24 2022',
          stats: {
            id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
            conditions: [
              {
                id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
              {
                id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
                partitions: [
                  {
                    id: 'is-it-cake_SelectSection',
                    users: 0,
                    groups: 0,
                  },
                ],
              },
            ],
          },
        },
      ],
      [DATE_RANGE.LAST_SIX_MONTHS]: null,
      [DATE_RANGE.LAST_THREE_MONTHS]: null,
      [DATE_RANGE.LAST_TWELVE_MONTHS]: null,
    },
    graphRange: DATE_RANGE.LAST_SEVEN_DAYS,
    isGraphInfoLoading: false,
    allDecisionPoints: {},
    allExperimentNames: null,
    contextMetaData: {
      contextMetadata: null,
    },
    updatedStat: {
      id: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
      users: 7,
      groups: 7,
      usersExcluded: 6,
      groupsExcluded: 6,
      conditions: [
        {
          id: '1b3ecdf4-71ee-45c7-a2b8-0e7aeff1e654',
          users: 3,
          groups: 3,
          partitions: [
            {
              id: 'is-it-cake_SelectSection',
              users: 3,
              groups: 3,
            },
          ],
        },
        {
          id: '8ba345e5-1191-4d5d-ab98-0fde3bb36919',
          users: 4,
          groups: 4,
          partitions: [
            {
              id: 'is-it-cake_SelectSection',
              users: 4,
              groups: 4,
            },
          ],
        },
      ],
    },
  };

  describe('#selectExperimentState', () => {
    it('should return entire state', () => {
      const result = selectExperimentState.projector(mockState);

      expect(result).toEqual(mockState);
    });
  });

  describe('#selectAllExperiment', () => {
    it('should return expirements list', () => {
      const state = { ...mockState };
      const experimentId = '1f12cd8f-7ff9-4731-a4eb-7104918ed252';
      const allExperiments = [state.entities[experimentId]];

      const result = selectAllExperiment.projector(state, allExperiments);

      expect(result).toEqual([
        {
          ...state.entities[experimentId],
          stat: {
            ...state.stats[experimentId],
          },
        },
      ]);
    });
  });

  describe('#selectIsLoadingExperiment', () => {
    it('should return isLoadingExperiment', () => {
      const state = {
        ...mockState,
        isLoadingExperiment: true,
      };

      const result = selectIsLoadingExperiment.projector(state);

      expect(result).toEqual(true);
    });
  });

  describe('#selectIsLoadingExperimentDetailStats', () => {
    it('should return selectIsLoadingExperimentDetailStats', () => {
      const state = {
        ...mockState,
        isLoadingExperiment: true,
      };

      const result = selectIsLoadingExperiment.projector(state);

      expect(result).toEqual(true);
    });
  });

  describe('#selectIsLoadingExperimentDetailStats', () => {
    it('should return selectIsLoadingExperimentDetailStats', () => {
      const state = {
        ...mockState,
        isLoadingExperimentDetailStats: true,
      };

      const result = selectIsLoadingExperimentDetailStats.projector(state);

      expect(result).toEqual(true);
    });
  });

  // mock router state
  describe('#selectSelectedExperiment', () => {
    it('should return selected experiment with stats mapped if stats id exists', () => {
      const previousState = {
        ...mockState,
      };
      const params = {
        experimentId: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
      };

      const result = selectSelectedExperiment.projector(
        {
          state: {
            params,
            url: 'test',
            queryParams: {},
          },
          navigationId: 0,
        },
        previousState
      );

      expect(result).toEqual({
        ...previousState.entities[params.experimentId],
        stat: {
          ...previousState.stats[params.experimentId],
        },
      });
    });

    it('should return selected experiment with null stats mapped if stats id is missing', () => {
      const previousState = {
        ...mockState,
        stats: {},
      };
      const params = {
        experimentId: '1f12cd8f-7ff9-4731-a4eb-7104918ed252',
      };

      const result = selectSelectedExperiment.projector(
        {
          state: {
            params,
            url: 'test',
            queryParams: {},
          },
          navigationId: 0,
        },
        previousState
      );

      expect(result).toEqual({
        ...previousState.entities[params.experimentId],
        stat: null,
      });
    });
  });

  describe('#selectExperimentById', () => {
    it('should return experiment by id', () => {
      const state = {
        ...mockState,
      };
      const experimentId = '1f12cd8f-7ff9-4731-a4eb-7104918ed252';

      const result = selectExperimentById.projector(state, {
        experimentId,
      });

      expect(result).toEqual(state.entities[experimentId]);
    });
  });

  describe('#selectExperimentStats', () => {
    it('should return experiment stats', () => {
      const state = {
        ...mockState,
      };

      const result = selectExperimentStats.projector(state);

      expect(result).toEqual(state.stats);
    });
  });

  describe('#selectAllPartitions', () => {
    it('should return experiment partitions', () => {
      const state = {
        ...mockState,
      };

      const result = selectAllDecisionPoints.projector(state);

      expect(result).toEqual(state.allDecisionPoints);
    });
  });

  describe('#selectSkipExperiment', () => {
    it('should return experiment skip value', () => {
      const state = {
        ...mockState,
      };

      const result = selectSkipExperiment.projector(state);

      expect(result).toEqual(state.skipExperiment);
    });
  });

  describe('#selectTotalExperiment', () => {
    it('should return total experiment count', () => {
      const state = {
        ...mockState,
      };

      const result = selectTotalExperiment.projector(state);

      expect(result).toEqual(state.totalExperiments);
    });
  });

  describe('#selectSearchKey', () => {
    it('should return search key', () => {
      const state = {
        ...mockState,
      };

      const result = selectSearchKey.projector(state);

      expect(result).toEqual(state.searchKey);
    });
  });

  describe('#selectSortAs', () => {
    it('should return search sort', () => {
      const state = {
        ...mockState,
      };

      const result = selectSortAs.projector(state);

      expect(result).toEqual(state.sortAs);
    });
  });

  describe('#selectSearchString', () => {
    it('should return search string', () => {
      const state = {
        ...mockState,
      };

      const result = selectSearchString.projector(state);

      expect(result).toEqual(state.searchString);
    });
  });

  describe('#selectSortKey', () => {
    it('should return search sort key', () => {
      const state = {
        ...mockState,
      };

      const result = selectSortKey.projector(state);

      expect(result).toEqual(state.sortKey);
    });
  });

  describe('#selectAllExperimentNames', () => {
    it('should return allExperimentNames', () => {
      const state = {
        ...mockState,
      };

      const result = selectAllExperimentNames.projector(state);

      expect(result).toEqual(state.allExperimentNames);
    });
  });

  describe('#selectIsGraphLoading', () => {
    it('should return isGraphInfoLoading', () => {
      const state = {
        ...mockState,
      };

      const result = selectIsGraphLoading.projector(state);

      expect(result).toEqual(state.isGraphInfoLoading);
    });
  });

  describe('#selectExperimentGraphRange', () => {
    it('should return graphRange', () => {
      const state = {
        ...mockState,
      };

      const result = selectExperimentGraphRange.projector(state);

      expect(result).toEqual(state.graphRange);
    });
  });

  describe('#selectExperimentGraphInfo', () => {
    it('should return graphRange when range param is matched', () => {
      const state = {
        ...mockState,
      };
      const range = DATE_RANGE.LAST_SEVEN_DAYS;

      const result = selectExperimentGraphInfo.projector(state, range);

      expect(result).toEqual(state.graphInfo[DATE_RANGE.LAST_SEVEN_DAYS]);
    });

    it('should return null when range param is not defined', () => {
      const state = {
        ...mockState,
      };
      const range = undefined;

      const result = selectExperimentGraphInfo.projector(state, range);

      expect(result).toEqual(null);
    });
  });

  describe('#selectExperimentStatById', () => {
    it('should return experiment stats by id', () => {
      const state = {
        ...mockState,
      };
      const experimentId = '1f12cd8f-7ff9-4731-a4eb-7104918ed252';

      const result = selectExperimentStatById.projector(state, {
        experimentId,
      });

      expect(result).toEqual(state.stats[experimentId]);
    });
  });

  describe('#selectContextMetaData', () => {
    it('should return contextMetaData', () => {
      const state = {
        ...mockState,
      };

      const result = selectContextMetaData.projector(state);

      expect(result).toEqual(state.contextMetaData);
    });
  });

  describe('#selectIsPollingExperimentDetailStats', () => {
    it('should return isPollingExperimentDetailStats', () => {
      const state = {
        ...mockState,
      };

      const result = selectIsPollingExperimentDetailStats.projector(state);

      expect(result).toEqual(state.isPollingExperimentDetailStats);
    });
  });
});
