import { Injectable, NgZone } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private message: NzMessageService,
    private readonly zone: NgZone
  ) {}

  default(message: string) {
    this.show(message, {
      duration: 2000
    });
  }

  info(message: string) {
    this.show(message, {
      duration: 2000
    });
  }

  success(message: string) {
    this.show(message, {
      duration: 2000
    });
  }

  warn(message: string) {
    this.show(message, {
      duration: 2500
    });
  }

  error(message: string) {
    this.show(message, {
      duration: 3000
    });
  }

  private show(message: string, configuration: any) {
    this.zone.run(() =>
      this.message.error(message, { nzDuration: configuration.duration })
    );
  }
}
