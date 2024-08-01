import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, NotificationService } from '../core.module';
import { NotificationType } from 'angular2-notifications';
import { SERVER_ERROR } from '../logs/store/logs.model';
import { actionLogoutStart } from '../auth/store/auth.actions';
import { NewErrorEvent } from './store/error-event-bus.model';
import { errorTypeToActionsMap } from './store/error-event-bus.actions';

@Injectable({
  providedIn: 'root',
})
export class ErrorEventBus {
  constructor(private store$: Store<AppState>, private notificationService: NotificationService) {}

  handleError(error: any) {
    const errorType = error?.type || error?.error?.type;
    const httpStatus = error?.status || error?.error?.status || error?.httpStatus;

    const hasErrorBeenHandled = !this.handleKnownErrors(errorType, String(httpStatus), error);

    if (!hasErrorBeenHandled) {
      this.notificationService.showSnackBar({
        type: NotificationType.Error,
        title: 'Network call failed.',
        content: error.url,
        animate: 'fromRight',
      });
    }
  }

  private handleKnownErrors(errorType: SERVER_ERROR | string, httpStatus: string, error: any): boolean {
    let hasErrorBeenHandled = this.handleHttpStatusCodeErrors(httpStatus);
    hasErrorBeenHandled = this.handleServerErrorTypes(errorType, error);
    return hasErrorBeenHandled;
  }

  private handleHttpStatusCodeErrors(httpStatus: string): boolean {
    let hasErrorBeenHandled = false;
    if (httpStatus === '401') {
      this.store$.dispatch(actionLogoutStart());
      hasErrorBeenHandled = true;
    }
    return hasErrorBeenHandled;
  }

  private handleServerErrorTypes(errorType: SERVER_ERROR | string, error: any): boolean {
    let hasErrorBeenHandled = false;
    const actions = errorTypeToActionsMap[errorType];
    if (actions) {
      const errorEvent: NewErrorEvent = {
        type: errorType,
        error,
        clear: () => this.store$.dispatch(actions.clear()),
      };
      this.store$.dispatch(actions.set({ errorEvent }));
      hasErrorBeenHandled = true;
    }
    return hasErrorBeenHandled;
  }
}
