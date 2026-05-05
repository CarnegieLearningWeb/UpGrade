import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import * as authActions from '../../../core/auth/store/auth.actions';
import { UserRole } from '../../../core/users/store/users.model';

const mockDevUser = {
  email: 'dev.user@example.com',
  firstName: 'Dev',
  lastName: 'User',
  imageUrl: 'https://example.com/image.png',
  role: UserRole.ADMIN,
};

describe('LoginComponent', () => {
  let mockAuthService: { initializeGoogleSignInButton: jest.Mock };
  let mockAuthDataService: { checkAuthConfig: jest.Mock };
  let mockStore: { dispatch: jest.Mock };

  const createComponent = (envName: string) =>
    new LoginComponent(mockAuthService as any, mockAuthDataService as any, mockStore as any, { envName } as any);

  beforeEach(() => {
    mockAuthService = { initializeGoogleSignInButton: jest.fn() };
    mockAuthDataService = { checkAuthConfig: jest.fn() };
    mockStore = { dispatch: jest.fn() };
  });

  describe('non-DEV environment', () => {
    it('calls initializeGoogleSignInButton directly without checking auth config', () => {
      const component = createComponent('PROD');

      component.ngAfterViewInit();

      expect(mockAuthService.initializeGoogleSignInButton).toHaveBeenCalledTimes(1);
      expect(mockAuthDataService.checkAuthConfig).not.toHaveBeenCalled();
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('DEV environment', () => {
    it('auto-logins as dev user when google auth is disabled', () => {
      mockAuthDataService.checkAuthConfig.mockReturnValue(of({ googleAuthRequired: false, devUser: mockDevUser }));
      const component = createComponent('DEV');

      component.ngAfterViewInit();

      expect(mockAuthDataService.checkAuthConfig).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        authActions.actionSetGoogleCredential({ googleCredential: 'fake-dev-user-google-credential' })
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        authActions.actionLoginStart({ user: mockDevUser, googleCredential: 'fake-dev-user-google-credential' })
      );
      expect(mockAuthService.initializeGoogleSignInButton).not.toHaveBeenCalled();
    });

    it('falls back to Google button when google auth is enabled', () => {
      mockAuthDataService.checkAuthConfig.mockReturnValue(of({ googleAuthRequired: true }));
      const component = createComponent('DEV');

      component.ngAfterViewInit();

      expect(mockAuthDataService.checkAuthConfig).toHaveBeenCalledTimes(1);
      expect(mockAuthService.initializeGoogleSignInButton).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });

    it('falls back to Google button when check-auth returns no dev user', () => {
      mockAuthDataService.checkAuthConfig.mockReturnValue(of({ googleAuthRequired: false, devUser: undefined }));
      const component = createComponent('DEV');

      component.ngAfterViewInit();

      expect(mockAuthService.initializeGoogleSignInButton).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });
  });
});
