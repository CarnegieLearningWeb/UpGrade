import { BehaviorSubject } from 'rxjs';
import { NegateAuthGuard } from './negate.auth.guard';

describe('NegateAuthGuard', () => {
  let service: NegateAuthGuard;
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
    service = new NegateAuthGuard(mockAuthService, mockRouter);
  });

  describe('#canActivate', () => {
    it('should return false and redirect if isLoggedIn is true and isAuthenticating is false', (done) => {
      mockAuthService.isLoggedIn$.next(true);
      mockAuthService.isAuthenticating$.next(false);
      const expectedResult = false;
      const expectedNavArray = ['/home'];

      service.canActivate().subscribe((val) => {
        expect(val).toEqual(expectedResult);
        expect(mockRouter.navigate).toHaveBeenCalledWith(expectedNavArray);
        done();
      });
    });

    it('should return true and redirect if isLoggedIn is false and isAuthenticating is false', (done) => {
      mockAuthService.isLoggedIn$.next(false);
      mockAuthService.isAuthenticating$.next(false);
      const expectedResult = true;

      service.canActivate().subscribe((val) => {
        expect(val).toEqual(expectedResult);
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
