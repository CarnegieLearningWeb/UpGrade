import { ActionsSubject } from "@ngrx/store";
import { ExperimentUsersEffects } from "./experiment-users.effects";
import * as ExperimentUsersActions from './experiment-users.actions';
import { of, throwError } from "rxjs";
import { fakeAsync, tick } from "@angular/core/testing";

describe('ExperimentUsersEffects', () => {
    let service: ExperimentUsersEffects;
    let actions$: ActionsSubject;
    let experimentUsersDataService: any;

    beforeEach(() => {
        actions$ = new ActionsSubject();
        experimentUsersDataService = {};

        service = new ExperimentUsersEffects(
            actions$,
            experimentUsersDataService,
        );
    })
    
    describe("#fetchExcludedUsers$", () => {
        it('should dispatch actionFetchExcludedUsersSuccess with entity collection on success', fakeAsync(() => {
            const mockEntities = [{
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                userId: 'abc123'
            }]

            experimentUsersDataService.fetchExcludedUsers = jest.fn().mockReturnValue(of(mockEntities));

            const action = ExperimentUsersActions.actionFetchExcludedUsersSuccess({ data: mockEntities });

            service.fetchExcludedUsers$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionFetchExcludedUsers());
        }))

        it('should dispatch actionFetchExcludedUsersFailure on error', fakeAsync(() => {
            experimentUsersDataService.fetchExcludedUsers = jest.fn().mockReturnValue(throwError(() => new Error("test")));

            const action = ExperimentUsersActions.actionFetchExcludedUsersFailure();

            service.fetchExcludedUsers$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionFetchExcludedUsers());
        }))
    })

    describe("#fetchExcludedGroups$", () => {
        it('should dispatch actionFetchExcludedGroupsSuccess with entity collection on success', fakeAsync(() => {
            const mockEntities = [{
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                groupId: 'xyz987',
                type: 'school'
            }]

            experimentUsersDataService.fetchExcludedGroups = jest.fn().mockReturnValue(of(mockEntities));

            const action = ExperimentUsersActions.actionFetchExcludedGroupsSuccess({ data: mockEntities });

            service.fetchExcludedGroups$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionFetchExcludedGroups());
        }))

        it('should dispatch actionFetchExcludedUsersFailure on error', fakeAsync(() => {
            experimentUsersDataService.fetchExcludedGroups = jest.fn().mockReturnValue(throwError(() => new Error("test")));

            const action = ExperimentUsersActions.actionFetchExcludedGroupsFailure();

            service.fetchExcludedGroups$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionFetchExcludedGroups());
        }))
    })

    describe("#excludedUser", () => {
        it('should do nothing if no id property in payload', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                userId: 'abc123'
            }
            let neverEmitted = true;

            experimentUsersDataService.excludeUser = jest.fn().mockReturnValue(of([mockEntity]));

            service.excludedUser$.subscribe((result: any) => {
                neverEmitted = false;
            })

            actions$.next(ExperimentUsersActions.actionExcludeUser({ id: undefined }));

            tick(0);
            expect(neverEmitted).toEqual(true);
            expect(experimentUsersDataService.excludeUser).not.toHaveBeenCalled();
        }))

        it('should dispatch actionExcludeUserSuccess with entity collection on success', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                userId: 'abc123'
            }

            experimentUsersDataService.excludeUser = jest.fn().mockReturnValue(of([mockEntity]));

            const action = ExperimentUsersActions.actionExcludeUserSuccess({ data: [mockEntity] });

            service.excludedUser$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionExcludeUser({ id: mockEntity.userId }));
        }))

        it('should dispatch actionExcludedUserFailure on error', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                userId: 'abc123'
            }

            experimentUsersDataService.excludeUser = jest.fn().mockReturnValue(throwError(() => new Error("test")));

            const action = ExperimentUsersActions.actionExcludedUserFailure();

            service.excludedUser$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionExcludeUser({ id: mockEntity.userId }));
        }))
    })

    describe("#excludedGroup", () => {
        it('should do nothing if no id property in payload', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                groupId: 'xyz987',
                type: 'school'
            }
            let neverEmitted = true;

            experimentUsersDataService.excludeGroup = jest.fn().mockReturnValue(of([mockEntity]));

            service.excludedGroup$.subscribe((result: any) => {
                neverEmitted = false;
            })

            actions$.next(ExperimentUsersActions.actionExcludeGroup({
                id: undefined,
                groupType: 'school' 
            }));

            tick(0);
            expect(neverEmitted).toEqual(true);
            expect(experimentUsersDataService.excludeGroup).not.toHaveBeenCalled();
        }))

        it('should dispatch actionExcludeGroupSuccess with entity collection on success', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                groupId: 'xyz987',
                type: 'school'
            }

            experimentUsersDataService.excludeGroup = jest.fn().mockReturnValue(of([mockEntity]));

            const action = ExperimentUsersActions.actionExcludeGroupSuccess({ data: [mockEntity] });

            service.excludedGroup$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionExcludeGroup({
                id: mockEntity.groupId,
                groupType: mockEntity.type
            }));
        }))

        it('should dispatch actionExcludedGroupFailure on error', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                groupId: 'xyz987',
                type: 'school'
            }

            experimentUsersDataService.excludeGroup = jest.fn().mockReturnValue(throwError(() => new Error("test")));

            const action = ExperimentUsersActions.actionExcludedGroupFailure();

            service.excludedGroup$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionExcludeGroup({
                id: mockEntity.groupId,
                groupType: mockEntity.type
            }));
        }))
    })

    describe("#deleteExcludedUser", () => {
        it('should do nothing if no id property in payload', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                userId: 'abc123'
            }
            let neverEmitted = true;

            experimentUsersDataService.deleteExcludedUser = jest.fn().mockReturnValue(of([mockEntity]));

            service.deleteExcludedUser$.subscribe((result: any) => {
                neverEmitted = false;
            })

            actions$.next(ExperimentUsersActions.actionDeleteExcludedUser({ id: undefined }));

            tick(0);
            expect(neverEmitted).toEqual(true);
            expect(experimentUsersDataService.deleteExcludedUser).not.toHaveBeenCalled();
        }))

        it('should dispatch actionDeleteExcludedUserSuccess with entity collection on success', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                userId: 'abc123'
            }

            experimentUsersDataService.deleteExcludedUser = jest.fn().mockReturnValue(of([mockEntity]));

            const action = ExperimentUsersActions.actionDeleteExcludedUserSuccess({ data: [mockEntity] });

            service.deleteExcludedUser$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionDeleteExcludedUser({ id: mockEntity.userId }));
        }))

        it('should dispatch actionExcludedUserFailure on error', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                userId: 'abc123'
            }

            experimentUsersDataService.deleteExcludedUser = jest.fn().mockReturnValue(throwError(() => new Error("test")));

            const action = ExperimentUsersActions.actionDeleteExcludedUserFailure();

            service.deleteExcludedUser$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionDeleteExcludedUser({ id: mockEntity.userId }));
        }))
    })

    describe("#deleteExcludedGroup", () => {
        it('should do nothing if no id property in payload', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                groupId: 'xyz987',
                type: 'school'
            }
            let neverEmitted = true;

            experimentUsersDataService.deleteExcludedGroup = jest.fn().mockReturnValue(of([mockEntity]));

            service.deleteExcludedGroup$.subscribe((result: any) => {
                neverEmitted = false;
            })

            actions$.next(ExperimentUsersActions.actionExcludeGroup({
                id: undefined,
                groupType: 'school' 
            }));

            tick(0);
            expect(neverEmitted).toEqual(true);
            expect(experimentUsersDataService.deleteExcludedGroup).not.toHaveBeenCalled();
        }))

        it('should dispatch actionDeleteExcludedGroupSuccess with entity collection on success', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                groupId: 'xyz987',
                type: 'school'
            }

            experimentUsersDataService.deleteExcludedGroup = jest.fn().mockReturnValue(of([mockEntity]));

            const action = ExperimentUsersActions.actionDeleteExcludedGroupSuccess({ data: [mockEntity] });

            service.deleteExcludedGroup$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionDeleteExcludedGroup({
                id: mockEntity.groupId,
                groupType: mockEntity.type
            }));
        }))

        it('should dispatch actionDeleteExcludedGroupFailure on error', fakeAsync(() => {
            const mockEntity = {
                createdAt: 'testDate',
                updatedAt: 'testDate',
                versionNumber: 0,
                groupId: 'xyz987',
                type: 'school'
            }

            experimentUsersDataService.deleteExcludedGroup = jest.fn().mockReturnValue(throwError(() => new Error("test")));

            const action = ExperimentUsersActions.actionDeleteExcludedGroupFailure();

            service.deleteExcludedGroup$.subscribe((result: any) => {
                tick(0);

                expect(result).toEqual(action);
            })

            actions$.next(ExperimentUsersActions.actionDeleteExcludedGroup({
                id: mockEntity.groupId,
                groupType: mockEntity.type
            }));
        }))
    })
})  