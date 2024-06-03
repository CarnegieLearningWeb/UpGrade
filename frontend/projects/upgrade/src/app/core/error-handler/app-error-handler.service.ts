import { Injectable, ErrorHandler, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../notifications/notification.service';
import { ENV, Environment } from '../../../environments/environment-types';

/** Application-wide error handler that adds a UI notification to the error handling
 * provided by the default Angular ErrorHandler.
 */
@Injectable()
export class AppErrorHandler extends ErrorHandler {
  constructor(private notificationsService: NotificationService, @Inject(ENV) private environment: Environment) {
    super();
  }

  handleError(error: Error | HttpErrorResponse) {
    const displayMessage = 'An error occurred. See console for details.';
    this.notificationsService.showError(displayMessage);
    super.handleError(error);
  }
}
