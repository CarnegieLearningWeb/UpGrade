import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { ClientAppHook, MockClientAppUser } from '../../../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private blankMockUser: MockClientAppUser = {
    id: '',
    groups: {},
    workingGroup: {},
    userAliases: [],
  };
  private blankHookEvent: ClientAppHook = { name: '', payload: null };

  public mockClientAppHook$ = new BehaviorSubject<ClientAppHook>(this.blankHookEvent);
  public mockAppUser$ = new BehaviorSubject<MockClientAppUser>({
    id: '',
    groups: {},
    workingGroup: {},
    userAliases: [],
  });
  public mockApp$ = new BehaviorSubject<string>('');
  public serverConnections$ = new BehaviorSubject<string[]>([]);

  dispatchHookEvent(hookEvent: ClientAppHook): void {
    console.log('[Dispatching hook]:', hookEvent);
    this.mockClientAppHook$.next(hookEvent);
  }

  dispatchMockUserChange(mockUser: any): void {
    console.log('[Dispatching user]:', mockUser);
    this.mockAppUser$.next(mockUser);
  }

  dispatchMockAppChange(mockAppName: string): void {
    console.log('[Dispatching mockAppName]:', mockAppName);
    this.mockApp$.next(mockAppName);
  }

  dispatchServerConnection(serverConnection: string): void {
    console.log('[Dispatching server connection]:', serverConnection);
    const currentConnections = this.serverConnections$.getValue();
    currentConnections.push(serverConnection);
    this.serverConnections$.next(currentConnections);
  }

  getCurrentClientAppMockUser(): MockClientAppUser {
    return this.mockAppUser$.getValue();
  }

  getCurrentServerConnections(): string[] {
    return this.serverConnections$.getValue();
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
