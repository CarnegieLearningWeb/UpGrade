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
    let displayMessage = 'An error occurred.';

    if (!this.environment.production) {
      displayMessage += ' See console for details.';
    }

    if (!((error as any).status === 401) && !this.environment.production) {
      this.notificationsService.error(displayMessage);
    }

    super.handleError(error);
  }
}
