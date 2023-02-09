import { fakeAsync, tick } from '@angular/core/testing';
import { ActionsSubject } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { last, pairwise, scan, take } from 'rxjs/operators';
import {
  actionDeleteExperimentSuccess,
  actionFetchAllExperimentNames,
  actionDeleteExperiment,
  actionUpdateExperimentStateSuccess,
  actionFetchAllExperimentNamesFailure,
  actionFetchAllExperimentNamesSuccess,
  actionFetchAllDecisionPointsFailure,
  actionFetchAllDecisionPoints,
  actionFetchAllDecisionPointsSuccess,
  actionFetchExperimentStats,
  actionFetchExperimentStatsFailure,
  actionFetchExperimentStatsSuccess,
  actionGetExperiments,
  actionGetExperimentsFailure,
  actionUpdateExperimentState,
  actionUpdateExperimentStateFailure,
  actionDeleteExperimentFailure,
  actionGetExperimentById,
  actionGetExperimentByIdSuccess,
  actionFetchExperimentDetailStatSuccess,
  actionFetchExperimentDetailStat,
  actionGetExperimentsSuccess,
  actionSetSkipExperiment,
  actionBeginExperimentDetailStatsPolling,
  actionFetchExperimentGraphInfo,
  actionUpsertExperiment,
  actionUpsertExperimentFailure,
  actionUpsertExperimentSuccess,
  actionSetIsGraphLoading,
  actionFetchExperimentGraphInfoFailure,
  actionFetchExperimentGraphInfoSuccess,
  actionSetGraphRange,
  actionSetExperimentGraphInfo,
  actionRemoveExperimentStat,
  actionSetSearchString,
  actionSetSearchKey,
  actionFetchContextMetaData,
  actionFetchContextMetaDataSuccess,
  actionFetchContextMetaDataFailure,
  actionExportExperimentInfo,
  actionExportExperimentInfoSuccess,
  actionExportExperimentDesignFailure,
  actionExportExperimentInfoFailure,
  actionExportExperimentDesign,
  actionExportExperimentDesignSuccess,
} from './experiments.actions';
import { ExperimentEffects } from './experiments.effects';
import {
  DATE_RANGE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_STATE,
  UpsertExperimentType,
} from './experiments.model';
import * as Selectors from './experiments.selectors';
import { environment } from '../../../../environments/environment';
import { actionExecuteQuery } from '../../analysis/store/analysis.actions';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { UserRole } from '../../users/store/users.model';
import { Environment } from '../../../../environments/environment-types';

describe('ExperimentEffects', () => {
  let service: ExperimentEffects;
  let actions$: ActionsSubject;
  let store$: any;
  let experimentDataService: any;
  let router: any;
  let snackbar: any;
  let mockEnvironment: Environment;

  beforeEach(() => {
    actions$ = new ActionsSubject();
    store$ = new BehaviorSubject({});
    store$.dispatch = jest.fn();
    experimentDataService = {};
    router = {
      navigate: jest.fn(),
    };
    snackbar = {
      open: jest.fn(),
    };
    mockEnvironment = { ...environment };
    service = new ExperimentEffects(actions$, store$, experimentDataService, router, snackbar, mockEnvironment);
  });

  describe('#getPaginatedExperiment$', () => {
    it('should catch and dispatch actionGetExperimentsFailure on error and exercise skip<total filter', fakeAsync(() => {
      experimentDataService.getAllExperiment = jest.fn().mockReturnValue(throwError('testError'));
      Selectors.selectSkipExperiment.setResult(0);
      Selectors.selectTotalExperiment.setResult(1);
      Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL);
      Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT);
      Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING);
      Selectors.selectSearchString.setResult('test');

      service.getPaginatedExperiment$.subscribe((result: any) => {
        tick(0);

        const failureAction = actionGetExperimentsFailure(result);

        expect(result).toEqual(failureAction);
      });

      actions$.next(actionGetExperiments({}));
    }));

    it('should catch and dispatch actionGetExperimentsFailure on error and exercise total=null filter', fakeAsync(() => {
      experimentDataService.getAllExperiment = jest.fn().mockReturnValue(throwError('testError'));
      Selectors.selectSkipExperiment.setResult(0);
      Selectors.selectTotalExperiment.setResult(null);
      Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL);
      Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT);
      Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING);
      Selectors.selectSearchString.setResult('test');

      service.getPaginatedExperiment$.subscribe((result: any) => {
        tick(0);

        const failureAction = actionGetExperimentsFailure(result);

        expect(result).toEqual(failureAction);
      });

      actions$.next(actionGetExperiments({}));
    }));

    it('should dispatch actionGetExperimentsSuccess and actionFetchExperimentStats when fromStaring is undefined', fakeAsync(() => {
      const experiments = [
        {
          id: 'test1',
        } as any,
      ];

      const experimentIds = ['test1'];
      const totalExperiments = 1;

      experimentDataService.getAllExperiment = jest.fn().mockReturnValue(of({ nodes: experiments, total: 1 }));
      Selectors.selectSkipExperiment.setResult(0);
      Selectors.selectTotalExperiment.setResult(1);
      Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL);
      Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT);
      Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING);
      Selectors.selectSearchString.setResult('test');

      service.getPaginatedExperiment$.pipe(take(2), pairwise()).subscribe((result: any) => {
        tick(0);

        const successAction = actionGetExperimentsSuccess({ experiments, totalExperiments });
        const fetchAction = actionFetchExperimentStats({ experimentIds });

        expect(result).toEqual([successAction, fetchAction]);
      });

      actions$.next(actionGetExperiments({}));
      tick(0);
    }));

    it('should dispatch actionSetSkipExperiment, actionGetExperimentsSuccess and actionFetchExperimentStats when fromStaring is true', fakeAsync(() => {
      const experiments = [
        {
          id: 'test1',
        } as any,
      ];

      const experimentIds = ['test1'];
      const totalExperiments = 1;

      experimentDataService.getAllExperiment = jest.fn().mockReturnValue(of({ nodes: experiments, total: 1 }));
      Selectors.selectSkipExperiment.setResult(2);
      Selectors.selectTotalExperiment.setResult(1);
      Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL);
      Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT);
      Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING);
      Selectors.selectSearchString.setResult('test');

      service.getPaginatedExperiment$
        .pipe(
          take(3),
          scan((acc, val) => {
            acc.unshift(val);
            acc.splice(3);
            return acc;
          }, []),
          last()
        )
        .subscribe((result: any) => {
          tick(0);

          const skipAction = actionSetSkipExperiment({ skipExperiment: 0 });
          const successAction = actionGetExperimentsSuccess({ experiments, totalExperiments });
          const fetchAction = actionFetchExperimentStats({ experimentIds });

          expect(result.reverse()).toEqual([skipAction, successAction, fetchAction]);
        });

      actions$.next(actionGetExperiments({ fromStarting: true }));
      tick(0);
    }));
  });

  describe('#fetchExperimentStatsForHome$', () => {
    const testExperimentIds = ['test1', 'test2', 'test3'];
    const testStatsInput = [
      {
        id: '1',
        users: 10,
      },
      {
        id: '2',
        users: 10,
      },
      {
        id: '3',
        users: 10,
      },
    ];

    const testStatsOutput = {
      '1': {
        id: '1',
        users: 10,
      },
      '2': {
        id: '2',
        users: 10,
      },
      '3': {
        id: '3',
        users: 10,
      },
    };

    it('should do nothing if experimentIds is empty', fakeAsync(() => {
      const experimentIds = [];
      const statsInput = [...testStatsInput];
      experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(statsInput));

      actions$.next(actionFetchExperimentStats({ experimentIds }));

      service.fetchExperimentStatsForHome$.subscribe();

      tick(0);

      expect(experimentDataService.getAllExperimentsStats).not.toHaveBeenCalled();
    }));

    it('should catch and dispatch success if stats returned', fakeAsync(() => {
      const experimentIds = [...testExperimentIds];
      const statsInput = [...testStatsInput];
      const statsOutput = { ...testStatsOutput };
      experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(statsInput));

      service.fetchExperimentStatsForHome$.subscribe((result: any) => {
        tick(0);

        const successAction = actionFetchExperimentStatsSuccess({ stats: statsOutput });

        expect(result).toEqual(successAction);
      });

      actions$.next(actionFetchExperimentStats({ experimentIds }));
    }));

    it('should catch and dispatch actionFetchExperimentStats on error', fakeAsync(() => {
      const experimentIds = [...testExperimentIds];
      experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(throwError('testError'));

      service.fetchExperimentStatsForHome$.subscribe((result: any) => {
        tick(0);

        const failureAction = actionFetchExperimentStatsFailure();

        expect(result).toEqual(failureAction);
      });

      actions$.next(actionFetchExperimentStats({ experimentIds }));
    }));
  });

  describe('UpsertExperiment$', () => {
    const experiment = {
      id: 'test1',
      queries: [{ id: 'queryid1' }],
    } as any;

    const stats = {
      id: 'test1',
      users: 10,
      groups: 2,
      usersExcluded: 1,
      groupsExcluded: 1,
      conditions: [],
    };

    const experimentStats = {
      test0: {},
    };

    beforeEach(() => {
      experimentDataService.createNewExperiment = jest.fn().mockReturnValue(of(experiment));
      experimentDataService.importExperiment = jest.fn().mockReturnValue(of(experiment));
      experimentDataService.updateExperiment = jest.fn().mockReturnValue(of(experiment));
    });

    it('should not do anything if experiment is falsey', fakeAsync(() => {
      const actionType = UpsertExperimentType.CREATE_NEW_EXPERIMENT;
      let neverEmitted = true;
      Selectors.selectExperimentStats.setResult({ test1: stats });

      service.UpsertExperiment$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(actionUpsertExperiment({ experiment: null, actionType }));

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should not do anything if actionType is falsey', fakeAsync(() => {
      let neverEmitted = true;
      Selectors.selectExperimentStats.setResult({ test1: stats });

      service.UpsertExperiment$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(actionUpsertExperiment({ experiment, actionType: null }));

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should call snackbar open and return actionUpsertExperimentFailure action if error is caught', fakeAsync(() => {
      const actionType = UpsertExperimentType.CREATE_NEW_EXPERIMENT;
      Selectors.selectExperimentStats.setResult({ test1: stats });
      experimentDataService.getAllExperimentsStats = jest
        .fn()
        .mockReturnValue(throwError({ error: { message: 'test1' } }));

      service.UpsertExperiment$.subscribe((resultingActions) => {
        const failureAction = actionUpsertExperimentFailure();

        expect(resultingActions).toEqual(failureAction);
      });

      actions$.next(actionUpsertExperiment({ experiment, actionType }));

      tick(0);
    }));

    it('should call createNewExperiment method with actiontype CREATE_NEW_EXPERIMENT and return array of 4 actions on successful stats call', fakeAsync(() => {
      const actionType = UpsertExperimentType.CREATE_NEW_EXPERIMENT;
      const expectedActions = [
        actionFetchExperimentStatsSuccess({ stats: { test1: undefined } }), // this seems weird
        actionUpsertExperimentSuccess({ experiment }),
        actionFetchAllDecisionPoints(),
        actionExecuteQuery({ queryIds: ['queryid1'] }),
      ];

      Selectors.selectExperimentStats.setResult({ test1: stats });
      experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(experimentStats));

      service.UpsertExperiment$.pipe(
        take(4),
        scan((acc, val) => {
          acc.unshift(val);
          acc.splice(4);
          return acc;
        }, []),
        last()
      ).subscribe((resultingActions) => {
        resultingActions.reverse();
        expect(resultingActions).toEqual(expectedActions);
        expect(experimentDataService.createNewExperiment).toHaveBeenCalled();
        expect(experimentDataService.importExperiment).not.toHaveBeenCalled();
        expect(experimentDataService.updateExperiment).not.toHaveBeenCalled();
      });

      actions$.next(actionUpsertExperiment({ experiment, actionType }));

      tick(0);
    }));

    it('should call importExperiment method with actiontype IMPORT_EXPERIMENT and return array of 4 actions on successful stats call', fakeAsync(() => {
      const actionType = UpsertExperimentType.IMPORT_EXPERIMENT;
      const expectedActions = [
        actionFetchExperimentStatsSuccess({ stats: { test1: undefined } }), // this seems weird
        actionUpsertExperimentSuccess({ experiment }),
        actionFetchAllDecisionPoints(),
        actionExecuteQuery({ queryIds: ['queryid1'] }),
      ];

      Selectors.selectExperimentStats.setResult({ test1: stats });
      experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(experimentStats));

      service.UpsertExperiment$.pipe(
        take(4),
        scan((acc, val) => {
          acc.unshift(val);
          acc.splice(4);
          return acc;
        }, []),
        last()
      ).subscribe((resultingActions) => {
        resultingActions.reverse();
        expect(resultingActions).toEqual(expectedActions);
        expect(experimentDataService.createNewExperiment).not.toHaveBeenCalled();
        expect(experimentDataService.importExperiment).toHaveBeenCalled();
        expect(experimentDataService.updateExperiment).not.toHaveBeenCalled();
      });

      actions$.next(actionUpsertExperiment({ experiment, actionType }));

      tick(0);
    }));

    it('should call updateExperiment method with actiontype UPDATE_EXPERIMENT and return array of 4 actions on successful stats call', fakeAsync(() => {
      const actionType = UpsertExperimentType.UPDATE_EXPERIMENT;
      const expectedActions = [
        actionFetchExperimentStatsSuccess({ stats: { test1: undefined } }), // this seems weird
        actionUpsertExperimentSuccess({ experiment }),
        actionFetchAllDecisionPoints(),
        actionExecuteQuery({ queryIds: ['queryid1'] }),
      ];

      Selectors.selectExperimentStats.setResult({ test1: stats });
      experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(experimentStats));

      service.UpsertExperiment$.pipe(
        take(4),
        scan((acc, val) => {
          acc.unshift(val);
          acc.splice(4);
          return acc;
        }, []),
        last()
      ).subscribe((resultingActions) => {
        resultingActions.reverse();
        expect(resultingActions).toEqual(expectedActions);
        expect(experimentDataService.createNewExperiment).not.toHaveBeenCalled();
        expect(experimentDataService.importExperiment).not.toHaveBeenCalled();
        expect(experimentDataService.updateExperiment).toHaveBeenCalled();
      });

      actions$.next(actionUpsertExperiment({ experiment, actionType }));

      tick(0);
    }));
  });

  describe('#updateExperimentState$', () => {
    it('should catch and dispatch updateExperimentState on error', fakeAsync(() => {
      const experimentId = 'test1';
      const experimentStateInfo = {
        newStatus: EXPERIMENT_STATE.ENROLLING,
      };
      experimentDataService.updateExperimentState = jest.fn().mockReturnValue(throwError('testError'));

      service.updateExperimentState$.subscribe((result: any) => {
        tick(0);

        const failureAction = actionUpdateExperimentStateFailure();

        expect(result).toEqual(failureAction);
      });

      actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));
    }));

    it('should do nothing if experimentId is empty', fakeAsync(() => {
      const experimentId = '';
      const experimentStateInfo = {
        newStatus: EXPERIMENT_STATE.ENROLLING,
      };
      experimentDataService.updateExperimentState = jest.fn();

      service.updateExperimentState$.subscribe();

      actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));

      tick(0);

      expect(experimentDataService.updateExperimentState).not.toHaveBeenCalled();
    }));

    it('should do nothing if experimentStateInfo is empty', fakeAsync(() => {
      const experimentId = 'test1';
      const experimentStateInfo = null;
      experimentDataService.updateExperimentState = jest.fn();

      service.updateExperimentState$.subscribe();

      actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));

      tick(0);

      expect(experimentDataService.updateExperimentState).not.toHaveBeenCalled();
    }));

    it('should dispatch actionUpdateExperimentStateSuccess on success', fakeAsync(() => {
      const experimentId = 'test1';
      const experimentStateInfo = {
        newStatus: EXPERIMENT_STATE.ENROLLING,
      };
      const experiment = {
        id: 'test1',
      } as any;
      experimentDataService.updateExperimentState = jest.fn().mockReturnValue(of(experiment));

      service.updateExperimentState$.subscribe((result: any) => {
        tick(0);

        const successAction = actionUpdateExperimentStateSuccess({ experiment: result.experiment });

        expect(result).toEqual(successAction);
      });

      actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));
    }));
  });

  describe('#deleteExperiment$', () => {
    const experimentId = 'test1';

    it('should return an array with actionDeleteExperimentSuccess and actionFetchAllPartitions', fakeAsync(() => {
      experimentDataService.deleteExperiment = jest.fn().mockReturnValue(of(experimentId));

      service.deleteExperiment$.pipe(take(2), pairwise()).subscribe((result: any) => {
        const successAction = actionDeleteExperimentSuccess({ experimentId });
        const fetchAction = actionFetchAllDecisionPoints();

        tick(0);
        expect(result).toEqual([successAction, fetchAction]);
      });

      actions$.next(actionDeleteExperiment({ experimentId }));
    }));

    it('should throw an error with actionDeleteExperimentFailure on error', fakeAsync(() => {
      experimentDataService.deleteExperiment = jest.fn().mockReturnValue(throwError('testError'));

      service.deleteExperiment$.subscribe((result: any) => {
        const failureAction = actionDeleteExperimentFailure();

        tick(0);
        expect(result).toEqual(failureAction);
      });

      actions$.next(actionDeleteExperiment({ experimentId }));
    }));
  });

  describe('#getExperimentById$', () => {
    const experimentId = 'testId';
    const experiment = {
      id: 'test1',
      stat: [
        {
          test1: {
            id: 'test1',
            users: 10,
            groups: 1,
          },
        },
      ],
    } as any;

    const stats = [
      {
        id: 'test1',
        users: 10,
      },
    ];
    const expectedStats = { test1: { id: 'test1', users: 10 } };

    it('should dispatch both actionGetExperimentByIdSuccess and actionFetchExperimentStatsSuccess on success', fakeAsync(() => {
      experimentDataService.getExperimentById = jest.fn().mockReturnValue(of(experiment));
      experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(stats));
      Selectors.selectExperimentStats.setResult({
        test1: {
          id: 'test1',
          users: 10,
          usersExcluded: 1,
          groupsExcluded: 0,
          groups: 2,
          conditions: [],
        },
      });

      service.getExperimentById$.pipe(take(2), pairwise()).subscribe((result: any) => {
        const successAction = actionGetExperimentByIdSuccess({ experiment });
        const fetchAction = actionFetchExperimentStatsSuccess({ stats: expectedStats });

        tick(0);
        expect(result).toEqual([successAction, fetchAction]);
      });

      actions$.next(actionGetExperimentById({ experimentId }));
    }));
  });

  describe('#getExperimentDetailStat', () => {
    const experimentId = 'test1';
    const stat = {
      id: 'test1',
      users: 10,
      groups: 1,
      usersExcluded: 0,
      groupsExcluded: 0,
      conditions: [],
    };

    it('should map result to action: actionFetchAllPartitionSuccess on success', fakeAsync(() => {
      experimentDataService.getExperimentDetailStat = jest.fn().mockReturnValue(of(stat));

      service.getExperimentDetailStat$.subscribe((result: any) => {
        tick(0);

        const successAction = actionFetchExperimentDetailStatSuccess({
          stat,
        });

        expect(result).toEqual(successAction);
      });

      actions$.next(actionFetchExperimentDetailStat({ experimentId }));
    }));

    it('should return action: actionFetchExperimentDetailStatFailure on failure', fakeAsync(() => {
      experimentDataService.getExperimentDetailStat = jest.fn().mockReturnValue(throwError('errorTest'));

      service.getExperimentDetailStat$.subscribe();

      actions$.next(actionFetchExperimentDetailStat({ experimentId }));

      tick(0);

      expect(experimentDataService.getExperimentDetailStat).toHaveBeenCalled();
    }));
  });

  describe('#beginExperimentDetailStatsPolling$', () => {
    it('should not emit anything if no experimentId is given', fakeAsync(() => {
      let neverEmitted = true;

      service.beginExperimentDetailStatsPolling$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId: '' }));

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should not emit anything if pollingLimit is surpassed', fakeAsync(() => {
      let neverEmitted = true;
      mockEnvironment.pollingLimit = 0;

      service.beginExperimentDetailStatsPolling$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId: 'test1' }));

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should not emit anything if isPolling is false', fakeAsync(() => {
      let neverEmitted = true;
      mockEnvironment.pollingInterval = 2;
      Selectors.selectIsPollingExperimentDetailStats.setResult(false);

      service.beginExperimentDetailStatsPolling$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId: 'test1' }));

      tick(10);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should dispatch actionFetchExperimentDetailStat and actionFetchExperimentGraphInfo when polling', fakeAsync(() => {
      mockEnvironment.pollingInterval = 2;
      const experimentId = 'test1';
      const graphInfo = {
        experimentId,
        range: DATE_RANGE.LAST_SEVEN_DAYS,
        clientOffset: -new Date().getTimezoneOffset(),
      };

      Selectors.selectIsPollingExperimentDetailStats.setResult(true);
      Selectors.selectExperimentGraphRange.setResult(graphInfo.range);

      service.beginExperimentDetailStatsPolling$.pipe(take(2), pairwise()).subscribe((result) => {
        const fetchStatsAction = actionFetchExperimentDetailStat({ experimentId });
        const fetchGraphInfoAction = actionFetchExperimentGraphInfo(graphInfo);

        expect(result).toEqual([fetchStatsAction, fetchGraphInfoAction]);
      });

      actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId }));

      tick(4);

      Selectors.selectIsPollingExperimentDetailStats.setResult(false);
    }));
  });

  describe('#fetchAllDecisionPoints', () => {
    it('should map result to action: actionFetchAllDecisionPointsSuccess on success', fakeAsync(() => {
      experimentDataService.fetchAllPartitions = jest.fn().mockReturnValue(of(['test1', 'test2']));

      service.fetchAllDecisionPoints.subscribe((result: any) => {
        tick(0);

        const successAction = actionFetchAllDecisionPointsSuccess({
          decisionPoints: result.decisionPoints,
        });

        expect(result).toEqual(successAction);
      });

      actions$.next(actionFetchAllDecisionPoints());
    }));

    it('should return action: actionFetchAllDecisionPointsFailure on failure', fakeAsync(() => {
      experimentDataService.fetchAllPartitions = jest.fn().mockReturnValue(throwError('errorTest'));

      service.fetchAllDecisionPoints.subscribe((result: any) => {
        tick(0);

        const failureAction = actionFetchAllDecisionPointsFailure();

        expect(result).toEqual(failureAction);
      });

      actions$.next(actionFetchAllDecisionPoints());
    }));
  });

  describe('#fetchAllExperimentNames$', () => {
    it('should map result to action: actionFetchAllExperimentNames on success', fakeAsync(() => {
      experimentDataService.fetchAllExperimentNames = jest.fn().mockReturnValue(
        of([
          {
            id: '1',
            name: 'test1',
          },
          {
            id: '2',
            name: 'test2',
          },
        ])
      );

      service.fetchAllExperimentNames$.subscribe((result: any) => {
        tick(0);

        const successAction = actionFetchAllExperimentNamesSuccess({
          allExperimentNames: result.allExperimentNames,
        });

        expect(result).toEqual(successAction);
      });

      actions$.next(actionFetchAllExperimentNames());
    }));

    it('should return action: actionFetchAllExperimentNamesFailure on failure', fakeAsync(() => {
      experimentDataService.fetchAllExperimentNames = jest.fn().mockReturnValue(throwError('errorTest'));

      service.fetchAllExperimentNames$.subscribe((result: any) => {
        tick(0);

        const failureAction = actionFetchAllExperimentNamesFailure();

        expect(result).toEqual(failureAction);
      });

      actions$.next(actionFetchAllExperimentNames());
    }));
  });

  describe('#fetchGraphInfo$', () => {
    const graphData = [
      {
        date: 'testDate',
        stats: {
          id: 'test1',
          conditions: [],
        },
      },
    ];

    it('should do nothing if experimentId is falsey', fakeAsync(() => {
      let neverEmitted = true;
      Selectors.selectExperimentGraphInfo.setResult([]);

      service.fetchGraphInfo$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        actionFetchExperimentGraphInfo({
          experimentId: '',
          range: DATE_RANGE.LAST_SEVEN_DAYS,
          clientOffset: -new Date().getTimezoneOffset(),
        })
      );

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should do nothing if range is falsey', fakeAsync(() => {
      let neverEmitted = true;
      Selectors.selectExperimentGraphInfo.setResult([]);

      service.fetchGraphInfo$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        actionFetchExperimentGraphInfo({
          experimentId: 'testId',
          range: null,
          clientOffset: -new Date().getTimezoneOffset(),
        })
      );

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should do nothing if clientOffset is falsey', fakeAsync(() => {
      let neverEmitted = true;
      Selectors.selectExperimentGraphInfo.setResult([]);

      service.fetchGraphInfo$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        actionFetchExperimentGraphInfo({
          experimentId: 'testId',
          range: DATE_RANGE.LAST_SEVEN_DAYS,
          clientOffset: null,
        })
      );

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should return failure and loading actions when catching an error', fakeAsync(() => {
      Selectors.selectExperimentGraphInfo.setResult(null);

      experimentDataService.fetchExperimentGraphInfo = jest.fn().mockReturnValue(throwError('error'));

      const expectedActions = [
        actionFetchExperimentGraphInfoFailure(),
        actionSetIsGraphLoading({ isGraphInfoLoading: false }),
      ];

      service.fetchGraphInfo$.pipe(take(2), pairwise()).subscribe((resultingActions) => {
        expect(resultingActions).toEqual(expectedActions);
      });

      actions$.next(
        actionFetchExperimentGraphInfo({
          experimentId: 'testId',
          range: DATE_RANGE.LAST_SEVEN_DAYS,
          clientOffset: -new Date().getTimezoneOffset(),
        })
      );

      tick(0);
    }));

    it('should emit no actions if graphData is already present', fakeAsync(() => {
      let neverEmitted = true;
      Selectors.selectExperimentGraphInfo.setResult(graphData);

      experimentDataService.fetchExperimentGraphInfo = jest.fn().mockReturnValue(of());

      const expectedActions = [];

      service.fetchGraphInfo$.subscribe((resultingActions) => {
        neverEmitted = false;
        expect(resultingActions).not.toEqual(expectedActions);
      });

      actions$.next(
        actionFetchExperimentGraphInfo({
          experimentId: 'testId',
          range: DATE_RANGE.LAST_SEVEN_DAYS,
          clientOffset: -new Date().getTimezoneOffset(),
        })
      );

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should return single action to actionFetchExperimentGraphInfoSuccess on success', fakeAsync(() => {
      Selectors.selectExperimentGraphInfo.setResult(null);

      experimentDataService.fetchExperimentGraphInfo = jest.fn().mockReturnValue(of(graphData));

      const expectedActions = actionFetchExperimentGraphInfoSuccess({
        range: DATE_RANGE.LAST_SEVEN_DAYS,
        graphInfo: [
          {
            date: 'testDate',
            stats: {
              id: 'test1',
              conditions: [],
            },
          },
        ],
      });

      service.fetchGraphInfo$.subscribe((resultingActions) => {
        expect(resultingActions).toEqual(expectedActions);
      });

      actions$.next(
        actionFetchExperimentGraphInfo({
          experimentId: 'testId',
          range: DATE_RANGE.LAST_SEVEN_DAYS,
          clientOffset: -new Date().getTimezoneOffset(),
        })
      );

      tick(0);
    }));
  });

  describe('#setExperimentGraphRange$', () => {
    it('should do nothing if experimentId is falsey', fakeAsync(() => {
      let neverEmitted = true;
      store$.dispatch = jest.fn();

      service.setExperimentGraphRange$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        actionSetGraphRange({
          experimentId: '',
          range: DATE_RANGE.LAST_SEVEN_DAYS,
          clientOffset: -new Date().getTimezoneOffset(),
        })
      );

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should call side effect to dispatch actionFetchExperimentGraphInfo if range is defined', fakeAsync(() => {
      const graphData = {
        experimentId: 'testId',
        range: DATE_RANGE.LAST_SEVEN_DAYS,
        clientOffset: -new Date().getTimezoneOffset(),
      };
      store$.dispatch = jest.fn();

      service.setExperimentGraphRange$.subscribe();

      actions$.next(actionSetGraphRange(graphData));

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(actionFetchExperimentGraphInfo(graphData));
    }));

    it('should call side effect to dispatch actionSetExperimentGraphInfo if range is not defined', fakeAsync(() => {
      const graphData = {
        experimentId: 'testId',
        range: undefined,
        clientOffset: -new Date().getTimezoneOffset(),
      };
      store$.dispatch = jest.fn();

      service.setExperimentGraphRange$.subscribe();

      actions$.next(actionSetGraphRange(graphData));

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(actionSetExperimentGraphInfo({ graphInfo: null }));
    }));
  });

  describe('navigateOnDeleteExperiment$', () => {
    it('should do nothing if experimentId is falsey', fakeAsync(() => {
      const experimentId = '';
      store$.dispatch = jest.fn();

      service.navigateOnDeleteExperiment$.subscribe();

      actions$.next(
        actionDeleteExperimentSuccess({
          experimentId,
        })
      );

      tick(0);

      expect(store$.dispatch).not.toHaveBeenCalled();
    }));

    it('should dispatch actionRemoveExperimentStat and call router nav to home if experimentId is valid', fakeAsync(() => {
      const experimentId = 'testId';
      store$.dispatch = jest.fn();

      service.navigateOnDeleteExperiment$.subscribe();

      actions$.next(
        actionDeleteExperimentSuccess({
          experimentId,
        })
      );

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(actionRemoveExperimentStat({ experimentStatId: experimentId }));
    }));
  });

  describe('#fetchExperimentOnSearchString$', () => {
    it('should dispatch actionGetExperiments if search string is not null', fakeAsync(() => {
      const searchString = 'testString';
      store$.dispatch = jest.fn();

      service.fetchExperimentOnSearchString$.subscribe();

      actions$.next(
        actionSetSearchString({
          searchString,
        })
      );

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(actionGetExperiments({ fromStarting: true }));
    }));

    it('should not dispatch actionGetExperiments if search string is null', fakeAsync(() => {
      const searchString = null;
      store$.dispatch = jest.fn();

      service.fetchExperimentOnSearchString$.subscribe();

      actions$.next(
        actionSetSearchString({
          searchString,
        })
      );

      tick(0);

      expect(store$.dispatch).not.toHaveBeenCalled();
    }));
  });

  describe('#fetchExperimentOnSearchKeyChange$', () => {
    it('should dispatch actionGetExperiments if search key changed as is truthy', fakeAsync(() => {
      const searchString = 'test';
      const searchKey = EXPERIMENT_SEARCH_KEY.ALL;
      store$.dispatch = jest.fn();
      Selectors.selectSearchString.setResult(searchString);

      service.fetchExperimentOnSearchKeyChange$.subscribe();

      actions$.next(
        actionSetSearchKey({
          searchKey,
        })
      );

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(actionGetExperiments({ fromStarting: true }));
    }));

    it('should NOT dispatch actionGetExperiments if search key changed as is falsey', fakeAsync(() => {
      const searchString = '';
      const searchKey = EXPERIMENT_SEARCH_KEY.ALL;
      store$.dispatch = jest.fn();
      Selectors.selectSearchString.setResult(searchString);

      service.fetchExperimentOnSearchKeyChange$.subscribe();

      actions$.next(
        actionSetSearchKey({
          searchKey,
        })
      );

      tick(0);

      expect(store$.dispatch).not.toHaveBeenCalled();
    }));
  });

  describe('#fetchContextMetaData$', () => {
    it('should not do anything if contextMetaData object already exists', fakeAsync(() => {
      let neverEmitted = true;
      Selectors.selectContextMetaData.setResult({
        contextMetadata: {
          someContext: {
            EXP_IDS: [],
            EXP_POINTS: [],
            CONDITIONS: [],
            GROUP_TYPES: [],
          },
        },
      });
      experimentDataService.fetchContextMetaData = jest.fn().mockReturnValue(of({ contextMetadata: {} }));

      service.fetchContextMetaData$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(actionFetchContextMetaData({ isLoadingContextMetaData: true }));

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should fetch contextMetaData if it does not already exist', fakeAsync(() => {
      const contextMetaData = {
        contextMetadata: {},
      };

      Selectors.selectContextMetaData.setResult({ contextMetadata: {} });
      experimentDataService.fetchContextMetaData = jest.fn().mockReturnValue(
        of({
          contextMetadata: {},
        })
      );

      const expectedAction = actionFetchContextMetaDataSuccess({ contextMetaData, isLoadingContextMetaData: false });

      service.fetchContextMetaData$.subscribe((resultingActions) => {
        expect(resultingActions).toEqual(expectedAction);
      });

      actions$.next(actionFetchContextMetaData({ isLoadingContextMetaData: false }));

      tick(0);
    }));

    it('should dispatch actionFetchContextMetaDataFailure error is caught fetching data', fakeAsync(() => {
      Selectors.selectContextMetaData.setResult({
        contextMetadata: {},
      });
      experimentDataService.fetchContextMetaData = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = actionFetchContextMetaDataFailure({ isLoadingContextMetaData: false });

      service.fetchContextMetaData$.subscribe((resultingActions) => {
        expect(resultingActions).toEqual(expectedAction);
      });

      actions$.next(actionFetchContextMetaData({ isLoadingContextMetaData: true }));

      tick(0);
    }));
  });

  describe('#exportExperimentInfo$', () => {
    it('should not do anything if experimentId is falsey', fakeAsync(() => {
      let neverEmitted = true;
      const experimentId = '';
      const experimentName = 'asdf';
      const user = {
        createdAt: '1234',
        updatedAt: '1234',
        versionNumber: '2',
        firstName: 'Johnny',
        lastName: 'Quest',
        imageUrl: 'www.jq.edu.gov.biz',
        email: 'email@test.com',
        role: UserRole.ADMIN,
      };
      selectCurrentUser.setResult(user);
      experimentDataService.exportExperimentInfo = jest.fn().mockReturnValue(of({}));

      service.exportExperimentInfo$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        actionExportExperimentInfo({
          experimentId,
          experimentName,
        })
      );

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should not do anything if email is falsey', fakeAsync(() => {
      let neverEmitted = true;
      const experimentId = 'test1';
      const experimentName = 'asdf';
      const user = {
        createdAt: '1234',
        updatedAt: '1234',
        versionNumber: '2',
        firstName: 'Johnny',
        lastName: 'Quest',
        imageUrl: 'www.jq.edu.gov.biz',
        email: '',
        role: UserRole.ADMIN,
      };
      selectCurrentUser.setResult(user);
      experimentDataService.exportExperimentInfo = jest.fn().mockReturnValue(of({}));

      service.exportExperimentInfo$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        actionExportExperimentInfo({
          experimentId,
          experimentName,
        })
      );

      tick(0);

      expect(neverEmitted).toBeTruthy();
    }));

    it('should dispatch actionExportExperimentInfoSuccess is email and experimentId are valid', fakeAsync(() => {
      const experimentId = 'test1';
      const experimentName = 'asdf';
      const user = {
        createdAt: '1234',
        updatedAt: '1234',
        versionNumber: '2',
        firstName: 'Johnny',
        lastName: 'Quest',
        imageUrl: 'www.jq.edu.gov.biz',
        email: 'email@test.com',
        role: UserRole.ADMIN,
      };

      selectCurrentUser.setResult(user);
      experimentDataService.exportExperimentInfo = jest.fn().mockReturnValue(of({}));

      const expectedAction = actionExportExperimentInfoSuccess();

      service.exportExperimentInfo$.subscribe((resultingActions) => {
        expect(resultingActions).toEqual(expectedAction);
      });

      actions$.next(
        actionExportExperimentInfo({
          experimentId,
          experimentName,
        })
      );

      tick(0);
    }));

    it('should dispatch actionExportExperimentDesignFailure on fetch error', fakeAsync(() => {
      const experimentId = 'test1';
      const experimentName = 'asdf';
      const user = {
        createdAt: '1234',
        updatedAt: '1234',
        versionNumber: '2',
        firstName: 'Johnny',
        lastName: 'Quest',
        imageUrl: 'www.jq.edu.gov.biz',
        email: 'email@test.com',
        role: UserRole.ADMIN,
      };

      selectCurrentUser.setResult(user);
      experimentDataService.exportExperimentInfo = jest.fn().mockReturnValue(throwError('test'));

      const expectedAction = actionExportExperimentInfoFailure();

      service.exportExperimentInfo$.subscribe((resultingActions) => {
        expect(resultingActions).toEqual(expectedAction);
      });

      actions$.next(
        actionExportExperimentInfo({
          experimentId,
          experimentName,
        })
      );

      tick(0);
    }));
  });

  describe('exportExperimentDesign$', () => {
    it('should dispatch actionExportExperimentDesignSuccess and call download function on success', fakeAsync(() => {
      const experimentId = 'testId';
      const data = {
        id: 'payloadObject',
      };
      experimentDataService.exportExperimentDesign = jest.fn().mockReturnValue(of([data]));

      const expectedAction = actionExportExperimentDesignSuccess();

      service.exportExperimentDesign$.subscribe((resultingAction) => {
        expect(resultingAction).toEqual(expectedAction);
      });

      actions$.next(actionExportExperimentDesign({ experimentIds: [experimentId] }));

      tick(0);
    }));

    it('should dispatch actionExportExperimentDesignFailure on fetch failure', fakeAsync(() => {
      const experimentId = 'testId';
      experimentDataService.exportExperimentDesign = jest.fn().mockReturnValue(throwError('error'));

      const expectedAction = actionExportExperimentDesignFailure();

      service.exportExperimentDesign$.subscribe((resultingAction) => {
        expect(resultingAction).toEqual(expectedAction);
      });

      actions$.next(actionExportExperimentDesign({ experimentIds: [experimentId] }));

      tick(0);
    }));
  });
});
