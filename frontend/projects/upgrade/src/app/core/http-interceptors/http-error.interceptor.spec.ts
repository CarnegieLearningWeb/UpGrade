import { throwError } from 'rxjs';
import { HttpErrorInterceptor } from './http-error.interceptor';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

class MockAuthService {}

class MockErrorEventBusService {
  handleError = jest.fn();
}

describe('HttpErrorInterceptor', () => {
  const mockAuthService: any = new MockAuthService();
  let errorEventBus: any = new MockErrorEventBusService();

  let service: HttpErrorInterceptor;

  beforeEach(() => {
    service = new HttpErrorInterceptor(mockAuthService);
    errorEventBus = new MockErrorEventBusService();
  });

  describe('#intercept', () => {
    it('should call handleError when intercept encounters an error', () => {
      const httpRequest = new HttpRequest('GET', '/test');
      const httpHandler = {
        handle: jest.fn().mockReturnValue(throwError(new HttpErrorResponse({ error: 'Error', status: 500 }))),
      };

      service.intercept(httpRequest, httpHandler).subscribe({
        error: () => {
          expect(errorEventBus.handleError).toHaveBeenCalled();
        },
      });
    });
  });
});
