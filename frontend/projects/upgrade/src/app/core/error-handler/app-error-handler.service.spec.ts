import { AppErrorHandler } from './app-error-handler.service';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';

describe('AppErrorHandler', () => {
  let mockNotificationsService: any;
  let mockEnvironment: Environment;
  let service: AppErrorHandler;

  beforeEach(() => {
    mockNotificationsService = {
      showError: jest.fn(),
    };
    mockEnvironment = { ...environment };
    service = new AppErrorHandler(mockNotificationsService, mockEnvironment);
  });

  it('should call notification service with an error of "An error occurred. See console for details." when not in production and not 401', () => {
    const mockError = { status: 400 } as any;
    const expectedValue = 'An error occurred. See console for details.';
    mockEnvironment.production = false;

    service.handleError(mockError);

    expect(mockNotificationsService.showError).toHaveBeenCalledWith(expectedValue);
  });
});
