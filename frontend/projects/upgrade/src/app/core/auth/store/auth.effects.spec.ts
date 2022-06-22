import { ActionsSubject } from "@ngrx/store";
import { BehaviorSubject, never, of, throwError } from "rxjs";
import { AuthEffects } from "./auth.effects";
import * as AuthActions from "./auth.actions";
import { fakeAsync, tick } from "@angular/core/testing";
import { environment } from "../../../../environments/environment";
import { UserRole } from "../../users/store/users.model";
import { actionFetchExcludedGroups, actionFetchExcludedUsers } from "../../experiment-users/store/experiment-users.actions";
import { actionFetchAllPartitions } from "../../experiments/store/experiments.actions";
import { actionFetchUsers } from "../../users/store/users.actions";
import { actionGetSetting } from "../../settings/store/settings.actions";
import { actionFetchMetrics } from "../../analysis/store/analysis.actions";
import { last, scan, take } from "rxjs/operators";
import { selectRedirectUrl } from "./auth.selectors";
import { Environment } from "../../../../environments/environment-types";

declare let window: {
    gapi: any
}

describe('AuthEffects', () => {
    let service: AuthEffects;
    let actions$: ActionsSubject;
    let router: any;
    let store$: any;
    let ngZone: any;
    let authDataService: any;
    let authService: any;
    let settingsService: any;
    let mockEnvironment: Environment;
    let mockUser = {
        currentUser: {
            listen: jest.fn(),
            getBasicProfile: () => {
                return {
                    getGivenName: jest.fn().mockReturnValue('Test'),
                    getFamilyName: jest.fn().mockReturnValue('Guy'),
                    getEmail: jest.fn().mockReturnValue('testmail.com'),
                    getImageUrl: jest.fn().mockReturnValue('image.com')
                }
            },
            getAuthResponse: () => {
                return {
                    id_token: 'abc123'
                }
            }
        }
    }
    let mockOAuth = {
        init: jest.fn().mockReturnValue(mockUser),
        isSignedIn: {
            get: () => {}
        },
        attachClickHandler: jest.fn(),
    }

    beforeEach(() => {
        actions$ = new ActionsSubject();
        store$ = new BehaviorSubject({});
        (store$ as any).dispatch = jest.fn();
        router = {
            navigate: jest.fn(),
            navigateByUrl: jest.fn()
        };
        ngZone = {
            run: (fn) => fn()
        };
        authDataService = {
            login: jest.fn()
        };
        authService = {
            setUserPermissions: jest.fn()
        };
        settingsService = {
            setLocalStorageTheme: jest.fn()
        };
        mockEnvironment = { ...environment };
        
        service = new AuthEffects(
            actions$,
            store$,
            router,
            ngZone,
            authDataService,
            authService,
            settingsService,
            mockEnvironment
        );

        // mock gapi.js object that is loaded via script on index.html
        window.gapi = {
            load: (str: string, fn: Function) => {
                fn();
            },
            auth2: mockOAuth
        }
    })

    describe('#initializeGapi$', () => {
        it('should call handleGapiInit callback withini gapi.load is set isAuthenticating to true', fakeAsync(() => {
            service.handleGapiInit = jest.fn();
            const dispatchedAction = AuthActions.actionSetIsAuthenticating({
                isAuthenticating: true
            })
            const expectedHandleGapiInitParams = {
                client_id: environment.gapiClientId,
                hosted_domain: environment.domainName
            }
            
            service.initializeGapi$.subscribe();

            actions$.next(AuthActions.actionInitializeGapi());

            tick(0);

            expect(store$.dispatch).toHaveBeenCalledWith(dispatchedAction);
            expect(service.handleGapiInit).toHaveBeenCalledWith(expectedHandleGapiInitParams);
        }))
    })

    describe('#handleGapiInit', () => {
        it('should call init and set listener on user object, have hosted_domain match env.domainName if given', () => {
            service.scope = ['profile', 'email'].join(' ');
            const client_id = 'abc123';
            const hosted_domain = "testdomain";

            const expectedConfig = {
                client_id,
                cookiepolicy: 'single_host_origin',
                scope: service.scope,
                hosted_domain
            }

            service.handleGapiInit({
                client_id,
                hosted_domain
            });

            expect(window.gapi.auth2.init).toHaveBeenCalledWith(expectedConfig);
            expect(service.auth2.currentUser.listen).toHaveBeenCalledWith(service.handleUserLoginInNgZone);
        })
    })
    
    describe('#handleUserLoginInNgZone', () => {
        it('should call handleUserLogin in ngzone run executor', () => {
            service.handleUserLogin = jest.fn();
            const currentUser = {
                test: 'testObj'
            }

            service.handleUserLoginInNgZone(currentUser);

            expect(service.handleUserLogin).toHaveBeenCalledWith(currentUser);
        })
    })

    describe('#handleUserLogin', () => {
        it('should not do anything if user has already clicked login', () => {
            service.hasUserClickedLogin = true;
            service.auth2 = mockOAuth;

            service.auth2.isSignedIn.get = jest.fn().mockReturnValue(true);

            service.handleUserLogin(mockUser);

            expect(service.auth2.isSignedIn.get).not.toHaveBeenCalled();
        })

        it('should dispatch setUserInfo when current user has profile and is signed in', () => {
            service.hasUserClickedLogin = false;
            service.auth2 = mockOAuth;
            service.auth2.isSignedIn.get = jest.fn().mockReturnValue(true);
            const mockProfile = {
                getEmail: () => 'test@testMail.com'
            }
            const mockAuthResponse = {
                id_token: 'abc123'
            }

            const expectedLoginAction = AuthActions.actionSetIsLoggedIn({
                isLoggedIn: true
            });
            const expectedIsAuthenticatedAction = AuthActions.actionSetIsAuthenticating({
                isAuthenticating: false
            });
            const expectedSetUserInfoDispatchAction = AuthActions.actionSetUserInfo({
                user: {
                    token: 'abc123',
                    email: 'test@testMail.com'
                }
            })

            const authedUser = {
                getBasicProfile: jest.fn().mockReturnValue(mockProfile),
                getAuthResponse: jest.fn().mockReturnValue(mockAuthResponse)
            };

            service.handleUserLogin(authedUser);

            expect(service.auth2.isSignedIn.get).toHaveBeenCalled();
            expect(store$.dispatch).toHaveBeenCalledWith(expectedLoginAction);
            expect(store$.dispatch).toHaveBeenCalledWith(expectedIsAuthenticatedAction);
            expect(store$.dispatch).toHaveBeenCalledWith(expectedSetUserInfoDispatchAction);
        })
    })

    describe('#attachSignIn$', () => {
        it('should do nothing if element is falsey', fakeAsync(() => {
            let neverEmitted = true;
            service.handleAttachGoogleAuthClickHandler = jest.fn();

            service.attachSignIn$.subscribe(() => {
                neverEmitted = false;
            })

            tick(0);

            actions$.next(AuthActions.actionBindAttachHandlerWithButton(null))

            expect(neverEmitted).toEqual(true);
            expect(service.handleAttachGoogleAuthClickHandler).not.toHaveBeenCalled();
        }))

        it('should call handler if element is truthy', fakeAsync(() => {
            let neverEmitted = true;
            service.handleAttachGoogleAuthClickHandler = jest.fn();
            const mockElement = { truthy: 'object' };

            service.attachSignIn$.subscribe(() => {
                neverEmitted = false;
            })

            tick(0);

            actions$.next(AuthActions.actionBindAttachHandlerWithButton({
                element: mockElement
            }))

            expect(neverEmitted).toEqual(false);
            expect(service.handleAttachGoogleAuthClickHandler).toHaveBeenCalled();
        }))
    })

    describe('#handleAttachGoogleAuthClickHandler', () => {
        it('should attach click handler', () => {
            service.auth2 = mockOAuth;
            const mockElement = {};
            service.handleAttachGoogleAuthClickHandler(mockElement);

            expect(service.auth2.attachClickHandler).toHaveBeenCalledWith(
                mockElement,
                {},
                service.onAuthedUserFetchSuccess,
                service.onAuthedUserFetchError
            );
        })
    })

    describe('#onAuthedUserFetchSuccess', () => {
        it('should set hasUserClickedLogin to true and call hanlder in ngZone', () => {
            service.hasUserClickedLogin = false;
            const mockGoogleUser = {};
            service.handleGoogleAuthClickInNgZone = jest.fn();

            service.onAuthedUserFetchSuccess(mockGoogleUser);

            expect(service.handleGoogleAuthClickInNgZone).toHaveBeenCalledWith(mockGoogleUser);
        })
    })

    describe('#onAuthedUserFetchError', () => {
        it('should dispatch login failure action', () => {
            service.onAuthedUserFetchError({ msg: 'error'});

            expect(store$.dispatch).toHaveBeenCalledWith(AuthActions.actionLoginFailure())
        })
    })

    describe('#handleGoogleAuthClickInNgZone', () => {
        it('should dispatch set user and call data service to login to backend', () => {
            const setUserAction = AuthActions.actionSetUserInfo({ user: { token: 'abc123' }});
            service.doLogin = jest.fn();
            service.handleGoogleAuthClickInNgZone(mockUser.currentUser);

            const expectedUserObject = {
                firstName: 'Test',
                lastName: 'Guy',
                email: 'testmail.com',
                imageUrl: 'image.com'
            }

            expect(store$.dispatch).toHaveBeenCalledWith(setUserAction);
            expect(service.doLogin).toHaveBeenCalledWith(expectedUserObject, 'abc123');
        })
    })

    describe('#doLogin', () => {
        it('should dispatch success and setUser actions on success', fakeAsync(() => {
            service.hasUserClickedLogin = true;
            const userResponse = {
                createdAt: '1234',
                updatedAt: '1234',
                versionNumber: '2',
                firstName: 'Johnny',
                lastName: 'Quest',
                imageUrl: 'www.jq.edu.gov.biz',
                email: 'email@test.com',
                role: UserRole.ADMIN
            }
            authDataService.login = jest.fn().mockReturnValue(of(userResponse));

            const user = {
                firstName: 'Test',
                lastName: 'Guy',
                email: 'testmail.com',
                imageUrl: 'image.com'
            }
            const token = 'abc123';

            const expectedSuccessAction = AuthActions.actionLoginSuccess();
            const expectedSetUserAction = AuthActions.actionSetUserInfo({
                user: { ...userResponse, token }
            })

            service.doLogin(user, token);

            tick(0);

            expect(service.hasUserClickedLogin).toEqual(false);
            expect(store$.dispatch).toHaveBeenCalledWith(expectedSuccessAction);
            expect(store$.dispatch).toHaveBeenCalledWith(expectedSetUserAction);
        }))

        it('should dispatch error on login fail', fakeAsync(() => {
            service.hasUserClickedLogin = true;
            const userResponse = {
                createdAt: '1234',
                updatedAt: '1234',
                versionNumber: '2',
                firstName: 'Johnny',
                lastName: 'Quest',
                imageUrl: 'www.jq.edu.gov.biz',
                email: 'email@test.com',
                role: UserRole.ADMIN
            }
            authDataService.login = jest.fn().mockReturnValue(throwError('error'));

            const user = {
                firstName: 'Test',
                lastName: 'Guy',
                email: 'testmail.com',
                imageUrl: 'image.com'
            }
            const token = 'abc123';

            const expectedSuccessAction = AuthActions.actionLoginSuccess();
            const expectedSetUserAction = AuthActions.actionSetUserInfo({
                user: { ...userResponse, token }
            })

            service.doLogin(user, token);

            tick(0);

            expect(service.hasUserClickedLogin).toEqual(true);
            expect(store$.dispatch).not.toHaveBeenCalledWith(expectedSuccessAction);
            expect(store$.dispatch).not.toHaveBeenCalledWith(expectedSetUserAction);
            expect(store$.dispatch).toHaveBeenCalledWith(AuthActions.actionLoginFailure())
        }))
    })

    describe('#setUserInfo$', () => {
        it('should do nothing if user email is falsey', fakeAsync(() => {
            let neverEmitted = true;

            service.attachSignIn$.subscribe(() => {
                neverEmitted = false;
            })

            tick(0);

            actions$.next(AuthActions.actionSetUserInfo(null))

            expect(neverEmitted).toEqual(true);
        }))

        it('should call setLocalStorage and userRole when user is defined with role', fakeAsync(() => {
            const user = {
                role: UserRole.ADMIN,
                email: 'testmail.com'
            }
            service.trySetUserSettingWithEmail = jest.fn().mockReturnValue(of([]))
            service.setUserSettingsWithRole = jest.fn().mockReturnValue(of([]))

            const actions = [
                actionFetchExcludedUsers(),
                actionFetchExcludedGroups(),
                actionFetchAllPartitions(),
                actionFetchUsers({ fromStarting: true }),
                actionGetSetting(),
                actionFetchMetrics()
            ];

            service.setUserInfoInStore$.subscribe((result) => {
                expect(settingsService.setLocalStorageTheme).toHaveBeenCalled();
                expect(result).toEqual([])
                expect(service.setUserSettingsWithRole).toHaveBeenCalledWith(
                    user,
                    actions
                );

                expect(service.trySetUserSettingWithEmail).not.toHaveBeenCalled();
            })
            
            actions$.next(AuthActions.actionSetUserInfo({ user }));

            tick(0);
        }))

        it('should call setLocalStorage and userRole when user is defined without role', fakeAsync(() => {
            const user = {
                role: null,
                email: 'testmail.com'
            }
            service.trySetUserSettingWithEmail = jest.fn().mockReturnValue(of([]))
            service.setUserSettingsWithRole = jest.fn().mockReturnValue(of([]))

            const actions = [
                actionFetchExcludedUsers(),
                actionFetchExcludedGroups(),
                actionFetchAllPartitions(),
                actionFetchUsers({ fromStarting: true }),
                actionGetSetting(),
                actionFetchMetrics()
            ];

            service.setUserInfoInStore$.subscribe((result) => {
                expect(settingsService.setLocalStorageTheme).toHaveBeenCalled();
                expect(result).toEqual([])
                expect(service.trySetUserSettingWithEmail).toHaveBeenCalledWith(
                    user,
                    actions
                );

                expect(service.setUserSettingsWithRole).not.toHaveBeenCalled();
            })
            
            actions$.next(AuthActions.actionSetUserInfo({ user }));

            tick(0);
        }))
    })

    describe('#setUserSettingsWithRole', () => {
        it('should set user permissions and return actions list with info success', () => {
            const user: any = {
                role: UserRole.ADMIN
            }

            const actions = [
                actionFetchExcludedUsers(),
                actionFetchExcludedGroups(),
                actionFetchAllPartitions(),
                actionFetchUsers({ fromStarting: true }),
                actionGetSetting(),
                actionFetchMetrics()
            ];

            const additionalSuccessAction = AuthActions.actionSetUserInfoSuccess({ user })

            const result = service.setUserSettingsWithRole(user, actions)

            expect(authService.setUserPermissions).toHaveBeenCalledWith(user.role);
            expect(result).toEqual([
                AuthActions.actionSetUserInfoSuccess({ user }),
                ...actions,
            ])
        })
    })

    describe('#trySetUserSettingWithEmail', () => {
        it('should return actionSetUserInfoFailed if response object is falsey at index 0', fakeAsync(() => {
            const user: any = {
                firstName: 'Test',
                lastName: 'Guy',
                email: 'testmail.com',
                imageUrl: 'image.com',
                role: UserRole.ADMIN,
                token: 'abc123'
            }

            const actions = [
                actionFetchExcludedUsers(),
                actionFetchExcludedGroups(),
                actionFetchAllPartitions(),
                actionFetchUsers({ fromStarting: true }),
                actionGetSetting(),
                actionFetchMetrics()
            ];
            
            const response = {}
            authDataService.getUserByEmail = jest.fn().mockReturnValue(of(response))

            const expectedActions = AuthActions.actionSetUserInfoFailed();

            service.trySetUserSettingWithEmail({}, actions).subscribe(result => {
                expect(result).toEqual(expectedActions)
            })

            tick(0)
        }))

        it('should return actionLogoutStart if response user ojb has no first name', fakeAsync(() => {
            const user: any = {
                firstName: null,
                lastName: 'Guy',
                email: 'testmail.com',
                imageUrl: 'image.com',
                role: UserRole.ADMIN,
                token: 'abc123'
            }

            const actions = [
                actionFetchExcludedUsers(),
                actionFetchExcludedGroups(),
                actionFetchAllPartitions(),
                actionFetchUsers({ fromStarting: true }),
                actionGetSetting(),
                actionFetchMetrics()
            ];
            
            const response = [
                user
            ]
            authDataService.getUserByEmail = jest.fn().mockReturnValue(of(response))

            const expectedActions = AuthActions.actionLogoutStart();

            service.trySetUserSettingWithEmail({}, actions).subscribe(result => {
                expect(result).toEqual(expectedActions)
            })

            tick(0)
        }))

        it('should set user permissions and return actions set if valid user details', fakeAsync(() => {
            const user: any = {
                firstName: 'Test',
                lastName: 'Guy',
                email: 'testmail.com',
                imageUrl: 'image.com',
                role: UserRole.ADMIN,
                token: 'abc123'
            }

            const actions = [
                actionFetchExcludedUsers(),
                actionFetchExcludedGroups(),
                actionFetchAllPartitions(),
                actionFetchUsers({ fromStarting: true }),
                actionGetSetting(),
                actionFetchMetrics()
            ];
            
            const response = [
                user
            ]
            authDataService.getUserByEmail = jest.fn().mockReturnValue(of(response))

            const expectedActions = [
                AuthActions.actionSetUserInfoSuccess({ user }),
                ...actions
            ];

            service.trySetUserSettingWithEmail({ token: 'abc123'}, actions).pipe(
                take(7),
                scan((acc, val) => {
                    acc.unshift(val);
                    acc.splice(7);
                    return acc;
                }, []),
                last(),
            ).subscribe(result => {
                expect(result.reverse()).toEqual(expectedActions)
                expect(authService.setUserPermissions).toHaveBeenCalledWith(user.role)
            })

            tick(0)
        }))
    })

    describe('#navigationOnLoginSuccess', () => {
        it('should call to navigate to redirectUrl if it exists', fakeAsync(() => {
            const route = '/test-route';
            selectRedirectUrl.setResult(route);

            service.navigationOnLoginSuccess$.subscribe();

            actions$.next(AuthActions.actionLoginSuccess());

            tick(0);

            expect(router.navigate).toHaveBeenCalledWith([route]);
        }))

        it('should call to navigate to "/home" if it redirectUrl is not provided', fakeAsync(() => {
            const route = '/home';
            selectRedirectUrl.setResult(null);

            service.navigationOnLoginSuccess$.subscribe();

            actions$.next(AuthActions.actionLoginSuccess());

            tick(0);

            expect(router.navigate).toHaveBeenCalledWith([route]);
        }))
    })

    describe('#navigationOnLogOutSuccess$', () => {
        it('should call to navigate to "/login"', fakeAsync(() => {
            const route = '/login';

            service.navigationOnLogOutSuccess$.subscribe();

            actions$.next(AuthActions.actionLogoutSuccess());

            tick(0);

            expect(router.navigateByUrl).toHaveBeenCalledWith(route);
        }))
    })
})