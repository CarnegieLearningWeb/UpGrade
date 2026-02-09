import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

export interface CloseModalEvent {
  identifier?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class CommonModalEventsService {
  public closeModalEvent$ = new Subject<CloseModalEvent>();

  constructor(private dialog: MatDialog) {}

  // raise an event with optional identifer or data to allow components to handle this event
  public emitCloseModalEvent(event: CloseModalEvent = {}): void {
    console.debug('CloseModalEvent:', event);
    this.closeModalEvent$.next(event);
  }

  // it is generally safe to force close modal if component is not handling the close event
  public forceCloseModal() {
    this.dialog.closeAll();
  }
}
