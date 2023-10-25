import { Inject, Injectable, NgZone } from '@angular/core';
import {
  MatLegacySnackBar as MatSnackBar,
  MatLegacySnackBarConfig as MatSnackBarConfig,
} from '@angular/material/legacy-snack-bar';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly zone: NgZone,
    private _notifications: NotificationsService,
    @Inject(ENV) private environment: Environment
  ) {}

  default(message: string) {
    this.show(message, {
      duration: 2000,
      panelClass: 'default-notification-overlay',
    });
  }

  info(message: string) {
    this.show(message, {
      duration: 2000,
      panelClass: 'info-notification-overlay',
    });
  }

  success(message: string, duration?: number) {
    this.show(message, {
      duration: duration || 2000,
      panelClass: 'success-notification-overlay',
    });
  }

  warn(message: string) {
    this.show(message, {
      duration: 2500,
      panelClass: 'warning-notification-overlay',
    });
  }

  error(message: string) {
    this.show(message, {
      duration: 1500,
      panelClass: 'error-notification-overlay',
    });
  }

  showError(message: string) {
    const temp = {
      type: NotificationType.Error,
      title: 'ERROR.',
      content: message,
      animate: 'fromRight',
    };
    this.showSnackBar(temp);
  }

  showSuccess(message: string) {
    const temp = {
      type: NotificationType.Success,
      title: 'Success',
      content: message,
      animate: 'fromRight',
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

  private show(message: string, configuration: MatSnackBarConfig) {
    // Need to open snackBar from Angular zone to prevent issues with its position per
    // https://stackoverflow.com/questions/50101912/snackbar-position-wrong-when-use-errorhandler-in-angular-5-and-material
    this.zone.run(() => this.snackBar.open(message, null, configuration));
  }
}
