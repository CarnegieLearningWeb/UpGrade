import { fakeAsync, tick } from '@angular/core/testing';
import { ActionsSubject } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { concatAll, concatMap, isEmpty, last, pairwise, scan, take, takeLast, takeUntil } from 'rxjs/operators';
import { actionDeleteExperimentSuccess, actionFetchAllExperimentNames, actionDeleteExperiment, actionUpdateExperimentStateSuccess, actionFetchAllExperimentNamesFailure, actionFetchAllExperimentNamesSuccess, actionFetchAllPartitionFailure, actionFetchAllPartitions, actionFetchAllPartitionSuccess, actionFetchExperimentStats, actionFetchExperimentStatsFailure, actionFetchExperimentStatsSuccess, actionGetExperiments, actionGetExperimentsFailure, actionUpdateExperimentState, actionUpdateExperimentStateFailure, actionDeleteExperimentFailure, actionGetExperimentById, actionGetExperimentByIdSuccess, actionFetchExperimentDetailStatSuccess, actionFetchExperimentDetailStat, actionGetExperimentsSuccess, actionSetSkipExperiment, actionBeginExperimentDetailStatsPolling, actionFetchExperimentGraphInfo } from './experiments.actions';
import { ExperimentEffects } from './experiments.effects';
import { DATE_RANGE, EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_AS, EXPERIMENT_SORT_KEY, EXPERIMENT_STATE } from './experiments.model';
import * as Selectors from './experiments.selectors';
import { environment } from '../../../../environments/environment';

describe('ExperimentEffects', () => {
    let service: ExperimentEffects;
    let actions$: ActionsSubject;
    let store$: any;
    let experimentDataService: any;
    let router: any;
    let snackbar: any;

    beforeEach(() => {
        actions$ = new ActionsSubject();
        store$ = new BehaviorSubject({});
        (store$ as any).dispatch = jest.fn();
        experimentDataService = {

        }
        router = {

        }
        snackbar = {

        }
        service = new ExperimentEffects(
            actions$,
            store$,
            experimentDataService,
            router,
            snackbar
        )
    })

    describe('#getPaginatedExperiment$', () => {
        const testExperimentList = [
            {
                id: '1',
            } as any,
            {
                id: '2'
            } as any,
            {
                id: '3'
            } as any
        ];

        it('should catch and dispatch actionGetExperimentsFailure on error and exercise skip<total filter', fakeAsync(() => {
            experimentDataService.getAllExperiment = jest.fn().mockReturnValue(throwError('testError'));
            Selectors.selectSkipExperiment.setResult(0)
            Selectors.selectTotalExperiment.setResult(1)
            Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL)
            Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT)
            Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING)
            Selectors.selectSearchString.setResult('test')

            service.getPaginatedExperiment$.subscribe((result: any) => {
                tick(0);

                const failureAction = actionGetExperimentsFailure(result)

                expect(result).toEqual(failureAction);
            })

            actions$.next(actionGetExperiments({}));
        }))

        it('should catch and dispatch actionGetExperimentsFailure on error and exercise total=null filter', fakeAsync(() => {
            experimentDataService.getAllExperiment = jest.fn().mockReturnValue(throwError('testError'));
            Selectors.selectSkipExperiment.setResult(0)
            Selectors.selectTotalExperiment.setResult(null)
            Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL)
            Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT)
            Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING)
            Selectors.selectSearchString.setResult('test')

            service.getPaginatedExperiment$.subscribe((result: any) => {
                tick(0);

                const failureAction = actionGetExperimentsFailure(result)

                expect(result).toEqual(failureAction);
            })

            actions$.next(actionGetExperiments({}));
        }))

        it('should dispatch actionGetExperimentsSuccess and actionFetchExperimentStats when fromStaring is undefined', fakeAsync(() => {
            const experiments = [
                {
                    id: 'test1'
                } as any
            ]

            const experimentIds = [ 'test1' ]
            const totalExperiments = 1;
            
            experimentDataService.getAllExperiment = jest.fn().mockReturnValue(of({ nodes: experiments, total: 1 }));
            Selectors.selectSkipExperiment.setResult(0)
            Selectors.selectTotalExperiment.setResult(1)
            Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL)
            Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT)
            Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING)
            Selectors.selectSearchString.setResult('test')

            service.getPaginatedExperiment$.pipe(
                take(2),
                pairwise()
            ).subscribe((result: any) => {
                tick(0)

                const successAction = actionGetExperimentsSuccess({ experiments, totalExperiments });
                const fetchAction = actionFetchExperimentStats({ experimentIds });

                expect(result).toEqual([ successAction, fetchAction ]);
            })

            actions$.next(actionGetExperiments({}));
            tick(0);
        }))

        it('should dispatch actionSetSkipExperiment, actionGetExperimentsSuccess and actionFetchExperimentStats when fromStaring is true', fakeAsync(() => {
            const experiments = [
                {
                    id: 'test1'
                } as any
            ]

            const experimentIds = [ 'test1' ]
            const totalExperiments = 1;
            
            experimentDataService.getAllExperiment = jest.fn().mockReturnValue(of({ nodes: experiments, total: 1 }));
            Selectors.selectSkipExperiment.setResult(2)
            Selectors.selectTotalExperiment.setResult(1)
            Selectors.selectSearchKey.setResult(EXPERIMENT_SEARCH_KEY.ALL)
            Selectors.selectSortKey.setResult(EXPERIMENT_SORT_KEY.CREATED_AT)
            Selectors.selectSortAs.setResult(EXPERIMENT_SORT_AS.ASCENDING)
            Selectors.selectSearchString.setResult('test')

            service.getPaginatedExperiment$.pipe(
                take(3),
                scan((acc, val) => {
                    acc.unshift(val);
                    acc.splice(3);
                    return acc;
                }, []),
                last(),
            ).subscribe((result: any) => {
                tick(0)

                const skipAction = actionSetSkipExperiment({ skipExperiment: 0 })
                const successAction = actionGetExperimentsSuccess({ experiments, totalExperiments });
                const fetchAction = actionFetchExperimentStats({ experimentIds });

                expect(result.reverse()).toEqual([ skipAction, successAction, fetchAction ]);
            })

            actions$.next(actionGetExperiments({ fromStarting: true }));
            tick(0);
        }))
    })

    describe('#fetchExperimentStatsForHome$', () => {
        const testExperimentIds = [
            'test1',
            'test2',
            'test3'
        ]
        const testStatsInput = [
            {
                id: '1',
                users: 10
            },
            {
                id: '2',
                users: 10
            },
            {
                id: '3',
                users: 10
            },
        ]

        const testStatsOutput = {
            '1': {
                id: '1',
                users: 10
            },
            '2': {
                id: '2',
                users: 10
            },
            '3': {
                id: '3',
                users: 10
            }
        }

        it('should do nothing if experimentIds is empty', fakeAsync(() => {
            const experimentIds = [];
            const statsInput = [...testStatsInput];
            experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(statsInput));

            actions$.next(actionFetchExperimentStats({ experimentIds }));

            service.fetchExperimentStatsForHome$.subscribe();

            tick(0);

            expect(experimentDataService.getAllExperimentsStats).not.toHaveBeenCalled();
        }))

        it('should catch and dispatch success if stats returned', fakeAsync(() => {
            const experimentIds = [...testExperimentIds];
            const statsInput = [...testStatsInput];
            const statsOutput = { ...testStatsOutput };
            experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(statsInput));

            service.fetchExperimentStatsForHome$.subscribe((result: any) => {
                tick(0);

                const successAction = actionFetchExperimentStatsSuccess({ stats: statsOutput })

                expect(result).toEqual(successAction);
            })

            actions$.next(actionFetchExperimentStats({ experimentIds }));
        }))

        it('should catch and dispatch actionFetchExperimentStats on error', fakeAsync(() => {
            const experimentIds = [...testExperimentIds];
            experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(throwError('testError'));

            service.fetchExperimentStatsForHome$.subscribe((result: any) => {
                tick(0);

                const failureAction = actionFetchExperimentStatsFailure()

                expect(result).toEqual(failureAction);
            })

            actions$.next(actionFetchExperimentStats({ experimentIds }));
        }))
    })

    describe('#updateExperimentState$', () => {
        it('should catch and dispatch updateExperimentState on error', fakeAsync(() => {
            const experimentId = 'test1';
            const experimentStateInfo = {
                newStatus: EXPERIMENT_STATE.ENROLLING
            }
            experimentDataService.updateExperimentState = jest.fn().mockReturnValue(throwError('testError'));

            service.updateExperimentState$.subscribe((result: any) => {
                tick(0);

                const failureAction = actionUpdateExperimentStateFailure()

                expect(result).toEqual(failureAction);
            })

            actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));
        }))

        it('should do nothing if experimentId is empty', fakeAsync(() => {
            const experimentId = '';
            const experimentStateInfo = {
                newStatus: EXPERIMENT_STATE.ENROLLING
            }
            experimentDataService.updateExperimentState = jest.fn();

            service.updateExperimentState$.subscribe();

            actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));

            tick(0);

            expect(experimentDataService.updateExperimentState).not.toHaveBeenCalled();
        }))

        it('should do nothing if experimentStateInfo is empty', fakeAsync(() => {
            const experimentId = 'test1';
            const experimentStateInfo = null
            experimentDataService.updateExperimentState = jest.fn();

            service.updateExperimentState$.subscribe();

            actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));

            tick(0);

            expect(experimentDataService.updateExperimentState).not.toHaveBeenCalled();
        }))

        it('should dispatch actionUpdateExperimentStateSuccess on success', fakeAsync(() => {
            const experimentId = 'test1';
            const experimentStateInfo = {
                newStatus: EXPERIMENT_STATE.ENROLLING
            }
            const experiment = {
                id: 'test1'
            } as any;
            experimentDataService.updateExperimentState = jest.fn().mockReturnValue(of(experiment));

            service.updateExperimentState$.subscribe((result: any) => {
                tick(0);

                const successAction = actionUpdateExperimentStateSuccess({ experiment: result.experiment })

                expect(result).toEqual(successAction);
            })

            actions$.next(actionUpdateExperimentState({ experimentId, experimentStateInfo }));
        }))
    })

    describe('#deleteExperiment$', () => {
        const experimentId = 'test1';

        it('should return an array with actionDeleteExperimentSuccess and actionFetchAllPartitions', fakeAsync(() => {
            experimentDataService.deleteExperiment = jest.fn().mockReturnValue(of(experimentId));

            service.deleteExperiment$
                .pipe(
                    take(2),
                    pairwise()
                )
                .subscribe((result: any) => {
                    const successAction = actionDeleteExperimentSuccess({ experimentId });
                    const fetchAction = actionFetchAllPartitions();
                    
                    tick(0)
                    expect(result).toEqual([successAction, fetchAction]);
                })
            
            actions$.next(actionDeleteExperiment({ experimentId }));
        }))

        it('should throw an error with actionDeleteExperimentFailure on error', fakeAsync(() => {
            experimentDataService.deleteExperiment = jest.fn().mockReturnValue(throwError('testError'));

            service.deleteExperiment$.subscribe((result: any) => {  
                const failureAction = actionDeleteExperimentFailure();
                
                tick(0)
                expect(result).toEqual(failureAction);
            })
            
            actions$.next(actionDeleteExperiment({ experimentId }));
        }))
    })

    describe('#getExperimentById$', () => {
        const experimentId = 'testId';
        const experiment = {
            id: 'test1',
            stat: [
                {
                    'test1': {
                        id: 'test1',
                        users: 10,
                        groups: 1
                    }
                }
            ]
        } as any;

        const stats = [
            {
                id: 'test1',
                users: 10
            }
        ]
        const expectedStats = { test1: { id: 'test1', users: 10 } }

        it('should dispatch both actionGetExperimentByIdSuccess and actionFetchExperimentStatsSuccess on success', fakeAsync(() => {
            experimentDataService.getExperimentById = jest.fn().mockReturnValue(of(experiment));
            experimentDataService.getAllExperimentsStats = jest.fn().mockReturnValue(of(stats));
            Selectors.selectExperimentStats.setResult({
                'test1': {
                    id: 'test1',
                    users: 10,
                    usersExcluded: 1,
                    groupsExcluded: 0,
                    groups: 2,
                    conditions: []
                }
            })
            
            service.getExperimentById$
                .pipe(
                    take(2),
                    pairwise()
                )
                .subscribe((result: any) => {
                    const successAction = actionGetExperimentByIdSuccess({ experiment });
                    const fetchAction = actionFetchExperimentStatsSuccess({ stats: expectedStats });
                    
                    tick(0)
                    expect(result).toEqual([successAction, fetchAction]);
                })
                
            actions$.next(actionGetExperimentById({ experimentId }));
        }))
    })

    describe('#getExperimentDetailStat', () => {
        const experimentId = 'test1';
        const stat = {
                id: 'test1',
                users: 10,
                groups: 1,
                usersExcluded: 0,
                groupsExcluded: 0,
                conditions: []
            }

        it('should map result to action: actionFetchAllPartitionSuccess on success', fakeAsync(() => {
            experimentDataService.getExperimentDetailStat = jest.fn().mockReturnValue(of(stat));

            service.getExperimentDetailStat$.subscribe((result: any) => {
                tick(0);

                const successAction = actionFetchExperimentDetailStatSuccess({
                    stat
                })

                expect(result).toEqual(successAction);
            })

            actions$.next(actionFetchExperimentDetailStat({ experimentId }));
        }))

        it('should return action: actionFetchExperimentDetailStatFailure on failure', fakeAsync(() => {
            experimentDataService.getExperimentDetailStat = jest.fn().mockReturnValue(throwError('errorTest'));

            service.getExperimentDetailStat$.subscribe();

            actions$.next(actionFetchExperimentDetailStat({ experimentId }));

            tick(0);

            expect(experimentDataService.getExperimentDetailStat).toHaveBeenCalled();
        }))
    })

    describe('#beginExperimentDetailStatsPolling$', () => {
        it('should not emit anything if no experimentId is given', fakeAsync(() => {
            let neverEmitted = true;

            service.beginExperimentDetailStatsPolling$.subscribe(_ => {
                neverEmitted = false;
            })

            actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId: '' }))

            tick(0);

            expect(neverEmitted).toBeTruthy();
        }))

        it('should not emit anything if pollingLimit is surpassed', fakeAsync(() => {
            let neverEmitted = true;
            const originalPollingLimit = environment.pollingLimit;
            environment.pollingLimit = 0;

            service.beginExperimentDetailStatsPolling$.subscribe(_ => {
                neverEmitted = false;
            })

            actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId: 'test1' }))

            tick(0);

            expect(neverEmitted).toBeTruthy();

            environment.pollingLimit = originalPollingLimit;
        }))

        it('should not emit anything if isPolling is false', fakeAsync(() => {
            let neverEmitted = true;
            const originalInterval = environment.pollingInterval;
            environment.pollingInterval = 2;
            Selectors.selectIsPollingExperimentDetailStats.setResult(false);

            service.beginExperimentDetailStatsPolling$.subscribe(isEmpty => {
                neverEmitted = false;
            })

            actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId: 'test1' }))

            tick(10);

            expect(neverEmitted).toBeTruthy();
            environment.pollingInterval = originalInterval;
        }))

        it('should dispatch actionFetchExperimentDetailStat and actionFetchExperimentGraphInfo when polling', fakeAsync(() => {
            const originalInterval = environment.pollingInterval;
            environment.pollingInterval = 2;
            const experimentId = 'test1';
            const graphInfo = {
                experimentId,
                range: DATE_RANGE.LAST_SEVEN_DAYS,
                clientOffset: -240
            }
            
            Selectors.selectIsPollingExperimentDetailStats.setResult(true);
            Selectors.selectExperimentGraphRange.setResult(graphInfo.range)

            service.beginExperimentDetailStatsPolling$.pipe(
                take(2),
                pairwise()
            )
            .subscribe(result => {
                const fetchStatsAction = actionFetchExperimentDetailStat({ experimentId });
                const fetchGraphInfoAction = actionFetchExperimentGraphInfo(graphInfo);

                expect(result).toEqual([ fetchStatsAction, fetchGraphInfoAction])
            })

            actions$.next(actionBeginExperimentDetailStatsPolling({ experimentId }))

            tick(10);

            Selectors.selectIsPollingExperimentDetailStats.setResult(false);

            tick(10);

            environment.pollingInterval = originalInterval;
        }))
    })

    describe('#fetchAllPartitions', () => {
        it('should map result to action: actionFetchAllPartitionSuccess on success', fakeAsync(() => {
            experimentDataService.fetchAllPartitions = jest.fn().mockReturnValue(of([
                'test1',
                'test2'
            ]));

            service.fetchAllPartitions.subscribe((result: any) => {
                tick(0);

                const successAction = actionFetchAllPartitionSuccess({
                    partitions: result.partitions
                })

                expect(result).toEqual(successAction);
            })

            actions$.next(actionFetchAllPartitions());
        }))

        it('should return action: actionFetchAllPartitionFailure on failure', fakeAsync(() => {
            experimentDataService.fetchAllPartitions = jest.fn().mockReturnValue(throwError('errorTest'));

            service.fetchAllPartitions.subscribe((result: any) => {
                tick(0);

                const failureAction = actionFetchAllPartitionFailure()

                expect(result).toEqual(failureAction);
            })

            actions$.next(actionFetchAllPartitions());
        }))
    })

    describe('#fetchAllExperimentNames$', () => {
        it('should map result to action: actionFetchAllExperimentNames on success', fakeAsync(() => {
            experimentDataService.fetchAllExperimentNames = jest.fn().mockReturnValue(of([
                {
                    id: '1',
                    name: 'test1',
                },
                {
                    id: '2',
                    name: 'test2'
                }
            ]));

            service.fetchAllExperimentNames$.subscribe((result: any) => {
                tick(0);

                const successAction = actionFetchAllExperimentNamesSuccess({
                    allExperimentNames: result.allExperimentNames
                });

                expect(result).toEqual(successAction);
            })

            actions$.next(actionFetchAllExperimentNames());
        }))

        it('should return action: actionFetchAllExperimentNamesFailure on failure', fakeAsync(() => {
            experimentDataService.fetchAllExperimentNames = jest.fn().mockReturnValue(throwError('errorTest'));

            service.fetchAllExperimentNames$.subscribe((result: any) => {
                tick(0);

                const failureAction = actionFetchAllExperimentNamesFailure()

                expect(result).toEqual(failureAction);
            })

            actions$.next(actionFetchAllExperimentNames());

        }))
    })
})