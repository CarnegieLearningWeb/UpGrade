import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { ClientAppHook, MockClientAppUser } from '../app-models';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private blankMockUser: MockClientAppUser = {
    id: '',
    group: {},
    workingGroup: {},
    userAliases: [],
  };
  private blankHookEvent: ClientAppHook = { name: '', payload: null };

  public mockClientAppHookDispatcher$ = new BehaviorSubject<ClientAppHook>(this.blankHookEvent);
  public mockAppUser$ = new BehaviorSubject<MockClientAppUser>({
    id: '',
    group: {},
    workingGroup: {},
    userAliases: [],
  });

  dispatchHookEvent(hookEvent: ClientAppHook): void {
    console.log('[Dispatching]:', hookEvent);
    this.mockClientAppHookDispatcher$.next(hookEvent);
  }

  dispatchMockUserChange(mockUser: any): void {
    console.log('[Dispatching]:', mockUser);
    this.mockAppUser$.next(mockUser);
  }

  getCurrentClientAppMockUser(): MockClientAppUser {
    return this.mockAppUser$.getValue();
  }

  attachCurrentUserToHook(hookEvent: ClientAppHook): ClientAppHook {
    return {
      ...hookEvent,
      user: this.getCurrentClientAppMockUser(),
    };
  }

  resetMockUser(): void {
    this.mockAppUser$.next(this.blankMockUser);
  }
}
