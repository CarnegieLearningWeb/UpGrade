import { AppErrorHandler } from './app-error-handler.service';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';

describe('AppErrorHandler', () => {
  let mockNotificationsService: any;
  let mockEnvironment: Environment;
  let service: AppErrorHandler;

  beforeEach(() => {
    mockNotificationsService = {
      error: jest.fn(),
    };
    mockEnvironment = { ...environment };
    service = new AppErrorHandler(mockNotificationsService, mockEnvironment);
  });

  it('should call notification service with an error of "An error occured. See console for details." when not in production and not 401', () => {
    const mockError = { status: 400 } as any;
    const expectedValue = 'An error occurred. See console for details.';
    mockEnvironment.production = false;

    service.handleError(mockError);

    expect(mockNotificationsService.error).toHaveBeenCalledWith(expectedValue);
  });

  it('should not call notification service with an error when not in production and is 401', () => {
    const mockError = { status: 401 } as any;
    const expectedValue = 'An error occurred. See console for details.';
    mockEnvironment.production = false;

    service.handleError(mockError);

    expect(mockNotificationsService.error).not.toHaveBeenCalledWith(expectedValue);
  });

  it('should not call when in production mode and 401', () => {
    const mockError = { status: 401 } as any;
    const expectedValue = 'An error occurred.';
    mockEnvironment.production = true;

    service.handleError(mockError);

    expect(mockNotificationsService.error).not.toHaveBeenCalledWith(expectedValue);
  });

  it('should not call when in production mode and 400', () => {
    const mockError = { status: 400 } as any;
    const expectedValue = 'An error occurred.';
    mockEnvironment.production = true;

    service.handleError(mockError);

    expect(mockNotificationsService.error).not.toHaveBeenCalledWith(expectedValue);
  });
});
