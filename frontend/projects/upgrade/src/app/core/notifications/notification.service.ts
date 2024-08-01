import { Injectable } from '@angular/core';
import { NotificationsService as AngularNotificationService, NotificationType } from 'angular2-notifications';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private angularNotificationService: AngularNotificationService) {}

  showInfo(message: string) {
    const temp = {
      type: NotificationType.Info,
      title: 'Info',
      content: message,
      animate: 'fromRight',
      timeOut: 3000,
    };
    this.showSnackBar(temp);
  }

  showWarning(message: string) {
    const temp = {
      type: NotificationType.Warn,
      title: 'Warning',
      content: message,
      animate: 'fromRight',
      timeOut: 3000,
    };
    this.showSnackBar(temp);
  }

  showError(message: string) {
    const temp = {
      type: NotificationType.Error,
      title: 'Error.',
      content: message,
      animate: 'fromRight',
      timeOut: 3000,
    };
    this.showSnackBar(temp);
  }

  showSuccess(message: string) {
    const temp = {
      type: NotificationType.Success,
      title: 'Success',
      content: message,
      animate: 'fromRight',
      timeOut: 3000,
    };
    this.showSnackBar(temp);
  }

  showSnackBar(snackBarDetail: any) {
    if (snackBarDetail.type === NotificationType.Error) {
      snackBarDetail.title += ' See console for details.';
    }
    this.angularNotificationService.create(
      snackBarDetail.title,
      snackBarDetail.content,
      snackBarDetail.type,
      snackBarDetail
    );
  }
}
