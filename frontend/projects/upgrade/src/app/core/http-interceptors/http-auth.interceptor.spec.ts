import { BehaviorSubject } from 'rxjs';
import { HttpAuthInterceptor } from './http-auth.interceptor';

describe('HttpAuthInterceptor', () => {
  let mockAuthService: any;
  let service: HttpAuthInterceptor;

  it('should set headers if idToken is present', () => {
    class MockAuthService {
      getGoogleCredential$ = new BehaviorSubject('abc123');
    }
    mockAuthService = new MockAuthService();
    service = new HttpAuthInterceptor(mockAuthService);
    const mockHeaders = {
      setHeaders: {
        Authorization: 'Bearer abc123',
      },
    };
    const mockRequest: any = {
      clone: jest.fn().mockReturnValue(mockHeaders),
    };
    const mockNext: any = {
      handle: jest.fn(),
    };

    service.intercept(mockRequest, mockNext);

    expect(mockRequest.clone).toHaveBeenCalledWith(mockHeaders);
    expect(mockNext.handle).toHaveBeenCalledWith(mockHeaders);
  });

  it('should NOT set headers if no idToken is present', () => {
    class MockAuthService {
      getGoogleCredential$ = new BehaviorSubject(null);
    }
    mockAuthService = new MockAuthService();
    service = new HttpAuthInterceptor(mockAuthService);
    const mockHeaders = {
      setHeaders: {
        Authorization: 'Bearer abc123',
      },
    };
    const mockRequest: any = {
      clone: jest.fn().mockReturnValue(mockHeaders),
    };
    const mockNext: any = {
      handle: jest.fn(),
    };

    service.intercept(mockRequest, mockNext);

    expect(mockRequest.clone).not.toHaveBeenCalled();
    expect(mockNext.handle).toHaveBeenCalledWith(mockRequest);
  });
});
