import { NotificationType } from 'angular2-notifications';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

class MockNotificationService {
  create = jest.fn();
}

describe('#NotificationService', () => {
  const mockNotificationService: any = new MockNotificationService();
  const mockEnvironment = { ...environment };
  const mockMessage = 'test123';

  let service: NotificationService;

  beforeEach(() => {
    mockNotificationService.create = jest.fn();
    service = new NotificationService(mockNotificationService, mockEnvironment);
  });

  // describe('#default', () => {
  //   it('should call snackbar.open correct message and options', () => {
  //     const message = mockMessage;
  //     const configuration = {
  //       duration: 2000,
  //       panelClass: 'default-notification-overlay',
  //     };

  //     service.default(message);

  //     expect(mockNotificationService.create).toHaveBeenCalledWith(message, null, configuration);
  //   });
  // });

  describe('#info', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        type: NotificationType.Info,
        title: 'Info',
        content: message,
        animate: 'fromRight',
        timeOut: 2000,
      };

      service.showInfo(message);

      expect(mockNotificationService.create).toHaveBeenCalledWith(
        'Info',
        message,
        NotificationType.Info,
        configuration
      );
    });
  });

  describe('#success', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        type: NotificationType.Success,
        title: 'Success',
        content: message,
        animate: 'fromRight',
        timeOut: 4000,
      };

      service.showSuccess(message);

      expect(mockNotificationService.create).toHaveBeenCalledWith(
        'Success',
        message,
        NotificationType.Success,
        configuration
      );
    });
  });

  describe('#warn', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        type: NotificationType.Warn,
        title: 'Warning',
        content: message,
        animate: 'fromRight',
        timeOut: 2500,
      };

      service.showWarning(message);

      expect(mockNotificationService.create).toHaveBeenCalledWith(
        'Warning',
        message,
        NotificationType.Warn,
        configuration
      );
    });
  });

  describe('#error', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        type: NotificationType.Error,
        title: 'Error. See console for details.',
        content: message,
        animate: 'fromRight',
        timeOut: 1500,
      };

      service.showError(message);

      expect(mockNotificationService.create).toHaveBeenCalledWith(
        'Error. See console for details.',
        message,
        NotificationType.Error,
        configuration
      );
    });
  });
});
