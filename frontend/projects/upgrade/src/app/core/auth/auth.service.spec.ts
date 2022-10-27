import { BehaviorSubject } from 'rxjs';
import { UserRole } from 'upgrade_types';
import { AuthService } from './auth.service';
import { actionBindAttachHandlerWithButton, actionInitializeGapi, actionLoginStart, actionLogoutStart, actionSetRedirectUrl } from './store/auth.actions';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

jest.mock('./store/auth.selectors', () => ({
        selectIsLoggedIn: jest.fn(),
        selectIsAuthenticating: jest.fn(),
        selectCurrentUser: jest.fn().mockReturnValueOnce({
            id: 'testUser',
            token: 'abc123'
        }).mockReturnValueOnce(null)
    }));

describe('AuthService', () => {
    const mockStore: any = MockStateStore$;
    let service: AuthService;
    
    beforeEach(() => {
        service = new AuthService(mockStore);
    });

    // the mocked selectCurrentUser store selector will emit a 'mock user' the first time.
    // it will emit null the second time.
    // specs within a describe block should be synchronous.
    // this gives a way to test the condition in 'getIdToken$' mapper.
    describe('#getIdToken$', () => {
        it('should return token when currentUser exists on first emit', (done) => {
            mockStore.next('thisValueIsMeaningless');

            service.getIdToken$.subscribe(val => {
                expect(val).toEqual('abc123')
                done();
            })
        })

        it('should return null when current user is falsey ', (done) => {
            mockStore.next('thisValueIsMeaningless');

            service.getIdToken$.subscribe(val => {
                expect(val).toEqual(null)
                done();
            })
        })
    })

    describe('#authLoginStart', () => {
        it('should dispatch actionLoginStart', () => {
            service.authLoginStart();

            expect(mockStore.dispatch).toHaveBeenCalledWith(actionLoginStart());
        })
    });

    describe('#authLogout', () => {
        it('should dispatch actionLogoutStart', () => {
            service.authLogout();

            expect(mockStore.dispatch).toHaveBeenCalledWith(actionLogoutStart());
        })
    });

    describe('#initializeGapi', () => {
        it('should dispatch actionInitializeGapi', () => {
            service.initializeGapi();

            expect(mockStore.dispatch).toHaveBeenCalledWith(actionInitializeGapi());
        })
    });

    describe('#attachSignIn', () => {
        it('should dispatch actionBindAttachHandlerWithButton', () => {
            const btn: any = { id: 'value' };

            service.attachSignIn(btn);

            expect(mockStore.dispatch).toHaveBeenCalledWith(actionBindAttachHandlerWithButton());
        })
    });

    describe('#setRedirectionUrl', () => {
        it('should dispatch actionSetRedirectUrl', () => {
            const mockUrl = 'test';

            service.setRedirectionUrl(mockUrl);

            expect(mockStore.dispatch).toHaveBeenCalledWith(actionSetRedirectUrl({ redirectUrl: mockUrl }));
        })
    });

    describe('#setUserPermissions', () => {
        it('should emit an admin permissions object when called with ADMIN', (done) => {
            const expectedRoleObject = {
                experiments: { create: true, read: true, update: true, delete: true },
                users: { create: true, read: true, update: true, delete: true },
                logs: { create: true, read: true, update: true, delete: true },
                manageRoles: { create: true, read: true, update: true, delete: true },
                featureFlags: { create: true, read: true, update: true, delete: true },
                metrics: { create: true, read: true, update: true, delete: true },
                segments: { create: true, read: true, update: true, delete: true },
            };

            service.setUserPermissions(UserRole.ADMIN);

            service.userPermissions$.subscribe(role => {
                expect(role).toEqual(expectedRoleObject);
                done();
            })

        });

        it('should emit an admin permissions object when called with CREATOR', (done) => {
            const expectedRoleObject = {
                experiments: { create: true, read: true, update: true, delete: true },
                users: { create: true, read: true, update: true, delete: true },
                logs: { create: false, read: true, update: false, delete: false },
                manageRoles: { create: false, read: true, update: false, delete: false },
                featureFlags: { create: true, read: true, update: true, delete: true },
                metrics: { create: true, read: true, update: true, delete: true },
                segments: { create: true, read: true, update: true, delete: true },
            }

            service.setUserPermissions(UserRole.CREATOR);

            service.userPermissions$.subscribe(role => {
                expect(role).toEqual(expectedRoleObject);
                done();
            })
            
        });

        it('should emit an admin permissions object when called with USER_MANAGER', (done) => {
            const expectedRoleObject = {
                experiments: { create: false, read: true, update: false, delete: false },
                users: { create: true, read: true, update: true, delete: true },
                logs: { create: false, read: true, update: false, delete: false },
                manageRoles: { create: false, read: true, update: false, delete: false },
                featureFlags: { create: false, read: true, update: false, delete: false },
                metrics: { create: false, read: true, update: false, delete: false },
                segments: { create: false, read: true, update: false, delete: false },
            };

            service.setUserPermissions(UserRole.USER_MANAGER);

            service.userPermissions$.subscribe(role => {
                expect(role).toEqual(expectedRoleObject);
                done();
            })

        });

        it('should emit an admin permissions object when called with READER', (done) => {
            const expectedRoleObject = {
                experiments: { create: false, read: true, update: false, delete: false },
                users: { create: false, read: true, update: false, delete: false },
                logs: { create: false, read: true, update: false, delete: false },
                manageRoles: { create: false, read: true, update: false, delete: false },
                featureFlags: { create: false, read: true, update: false, delete: false },
                metrics: { create: false, read: true, update: false, delete: false },
                segments: { create: false, read: true, update: false, delete: false },
            }

            service.setUserPermissions(UserRole.READER);

            service.userPermissions$.subscribe(role => {
                expect(role).toEqual(expectedRoleObject);
                done();
            })

        });
    })
})