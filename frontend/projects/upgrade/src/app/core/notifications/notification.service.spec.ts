import { NotificationService } from './notification.service';

describe('#NotificationService', () => {
  let mockSnackBar: any;
  let mockZone: any;
  let service: NotificationService;
  const mockMessage = 'test123';

  beforeEach(() => {
    mockSnackBar = {
      open: jest.fn(),
    };
    mockZone = {
      run: (callback: any) => {
        callback();
      },
    };
    service = new NotificationService(mockSnackBar, mockZone);
  });

  describe('#default', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        duration: 2000,
        panelClass: 'default-notification-overlay',
      };

      service.default(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, null, configuration);
    });
  });

  describe('#info', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        duration: 2000,
        panelClass: 'info-notification-overlay',
      };

      service.info(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, null, configuration);
    });
  });

  describe('#success', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        duration: 2000,
        panelClass: 'success-notification-overlay',
      };

      service.success(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, null, configuration);
    });
  });

  describe('#warn', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        duration: 2500,
        panelClass: 'warning-notification-overlay',
      };

      service.warn(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, null, configuration);
    });
  });

  describe('#error', () => {
    it('should call snackbar.open correct message and options', () => {
      const message = mockMessage;
      const configuration = {
        duration: 1500,
        panelClass: 'error-notification-overlay',
      };

      service.error(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, null, configuration);
    });
  });
});
