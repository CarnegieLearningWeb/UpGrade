import { RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthGuard } from './auth.guard.';

describe(AuthGuard, () => {
  let service: AuthGuard;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn(),
    };
    mockAuthService = {
      isLoggedIn$: new BehaviorSubject(false),
      isAuthenticating$: new BehaviorSubject(false),
      setRedirectionUrl: jest.fn(),
    };
    service = new AuthGuard(mockAuthService, mockRouter);
  });

  describe('#canActivate', () => {
    it('should return true and do no redirect if isLoggedIn is true and isAuthenticating is false', (done) => {
      mockAuthService.isLoggedIn$.next(true);
      mockAuthService.isAuthenticating$.next(false);
      const expectedResult = true;
      const mockUrl = 'testUrl';

      service.canActivate(undefined, { url: mockUrl } as RouterStateSnapshot).subscribe((val) => {
        expect(val).toEqual(expectedResult);
        expect(mockAuthService.setRedirectionUrl).not.toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return false and redirect if isLoggedIn is false and isAuthenticating is false', (done) => {
      mockAuthService.isLoggedIn$.next(false);
      mockAuthService.isAuthenticating$.next(false);
      const expectedResult = false;
      const mockUrl = 'testUrl';
      const expectedNavArray = ['/login'];

      service.canActivate(undefined, { url: mockUrl } as RouterStateSnapshot).subscribe((val) => {
        expect(val).toEqual(expectedResult);
        expect(mockAuthService.setRedirectionUrl).toHaveBeenCalledWith(mockUrl);
        expect(mockRouter.navigate).toHaveBeenCalledWith(expectedNavArray);
        done();
      });
    });
  });
});
