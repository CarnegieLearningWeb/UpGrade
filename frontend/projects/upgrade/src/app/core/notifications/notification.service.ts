import { Inject, Injectable } from '@angular/core';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private _notifications: NotificationsService, @Inject(ENV) private environment: Environment) {}

  showInfo(message: string) {
    const temp = {
      type: NotificationType.Info,
      title: 'Info',
      content: message,
      animate: 'fromRight',
      timeOut: 2000,
    };
    this.showSnackBar(temp);
  }

  showWarning(message: string) {
    const temp = {
      type: NotificationType.Warn,
      title: 'Warning',
      content: message,
      animate: 'fromRight',
      timeOut: 2500,
    };
    this.showSnackBar(temp);
  }

  showError(message: string) {
    const temp = {
      type: NotificationType.Error,
      title: 'Error.',
      content: message,
      animate: 'fromRight',
      timeOut: 1500,
    };
    this.showSnackBar(temp);
  }

  showSuccess(message: string) {
    const temp = {
      type: NotificationType.Success,
      title: 'Success',
      content: message,
      animate: 'fromRight',
      timeOut: 4000,
    };
    this.showSnackBar(temp);
  }

  private showSnackBar(snackBarDetail: any) {
    if (snackBarDetail.type === NotificationType.Error) {
      snackBarDetail.title += ' See console for details.';
    }
    if (!this.environment.production) {
      this._notifications.create(snackBarDetail.title, snackBarDetail.content, snackBarDetail.type, snackBarDetail);
    }
  }
}
