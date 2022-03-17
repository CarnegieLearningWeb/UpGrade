import { UserRole } from "../../../../../../../types/src/Experiment/enums";
import { MockStateStore } from "../../../testing/common.dependencies.mock";
import { AuthService } from "./auth.service";
import { actionBindAttachHandlerWithButton, actionInitializeGapi, actionLoginStart, actionLogoutStart, actionSetRedirectUrl } from "./store/auth.actions";

describe('AnalysisService', () => {
    let mockStore: MockStateStore;
    let service: AuthService;
    
    beforeEach(() => {
        mockStore = new MockStateStore();
        service = new AuthService(mockStore as any);
    });

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
            const mockElement: any = { id: 'value' };

            service.attachSignIn(mockElement);

            expect(mockStore.dispatch).toHaveBeenCalledWith(actionBindAttachHandlerWithButton({ element: mockElement}));
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
                metrics: { create: true, read: true, update: true, delete: true }
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
                metrics: { create: true, read: true, update: true, delete: true }
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
                metrics: { create: false, read: true, update: false, delete: false }
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
                metrics: { create: false, read: true, update: false, delete: false }
            }

            service.setUserPermissions(UserRole.READER);

            service.userPermissions$.subscribe(role => {
                expect(role).toEqual(expectedRoleObject);
                done();
            })

        });
    })
})