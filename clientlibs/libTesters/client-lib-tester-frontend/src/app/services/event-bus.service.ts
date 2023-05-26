import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { HookEvent } from '../client-library-data';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  public mockClientAppHookDispatcher$ = new BehaviorSubject<HookEvent>({ name: '', payload: null });

  dispatch(hookEvent: HookEvent): void {
    console.log('[Dispatching]:', hookEvent);
    this.mockClientAppHookDispatcher$.next(hookEvent);
  }
}
