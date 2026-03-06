import { AuthState } from './auth.models';
import { UserRole } from '../../users/store/users.model';
import * as AuthSelectors from './auth.selectors';

describe('Auth Selectors', () => {
  const mockState: AuthState = {
    isLoggedIn: true,
    isAuthenticating: false,
    redirectUrl: 'test.com',
    user: {
      createdAt: '1234',
      updatedAt: '1234',
      versionNumber: '2',
      firstName: 'Johnny',
      lastName: 'Quest',
      imageUrl: 'www.jq.edu.gov.biz',
      email: 'email@test.com',
      role: UserRole.ADMIN,
    },
    googleCredential: 'test',
  };

  describe('#selectAuth', () => {
    it('should select all authState', () => {
      const state = { ...mockState };

      const result = AuthSelectors.selectAuth.projector(state);

      expect(result).toEqual(state);
    });
  });

  describe('#selectIsLoggin', () => {
    it('should select isLoggedIn', () => {
      const state = { ...mockState };

      const result = AuthSelectors.selectIsLoggedIn.projector(state);

      expect(result).toEqual(state.isLoggedIn);
    });
  });

  describe('#selectIsAuthenticating', () => {
    it('should select isAuthenticating', () => {
      const state = { ...mockState };

      const result = AuthSelectors.selectIsAuthenticating.projector(state);

      expect(result).toEqual(state.isAuthenticating);
    });
  });

  describe('#selectIsAuthenticating', () => {
    it('should select user', () => {
      const state = { ...mockState };

      const result = AuthSelectors.selectCurrentUser.projector(state);

      expect(result).toEqual(state.user);
    });
  });

  describe('#selectRedirectUrl', () => {
    it('should select url string if defined', () => {
      const state = { ...mockState };
      state.redirectUrl = 'test.com';

      const result = AuthSelectors.selectRedirectUrl.projector(state);

      expect(result).toEqual(state.redirectUrl);
    });

    it('should select url string as null if not defined', () => {
      const state = { ...mockState };
      state.redirectUrl = undefined;

      const result = AuthSelectors.selectRedirectUrl.projector(state);

      expect(result).toEqual(null);
    });
  });
});
