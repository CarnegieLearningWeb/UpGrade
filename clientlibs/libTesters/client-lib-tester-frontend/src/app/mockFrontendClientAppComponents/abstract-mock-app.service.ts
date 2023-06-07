import { Subscription } from 'rxjs';
import { ClientAppHook, CodeLanguage, MockAppType, MockClientAppInterfaceModel } from '../../../../shared/models';
import { EventBusService } from '../services/event-bus.service';
import { InjectionToken } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';

export const ABSTRACT_MOCK_APP_SERVICE_TOKEN = new InjectionToken<AbstractMockAppService>('Abstract Mock App Service');

/**
 * This Abstract service is base class for all Mock App instances.
 * It will handle linking to tester events getting the right UpgradeClient instance.
 *
 * A Mock App instance must have the following:
 *
 * 1. Class properties that describe app metadata constants.
 *
 * 2. Implements a method called "getAppInterfaceModel()" that returns a MockClientAppInterfaceModel.
 * This model is used by the tester app to construct an interface to use this 'app'.
 *
 * 3. Implements a method called "routeHook(hookEvent: ClientAppHook): void".
 * This will internally route the hook ecent to the appropriate custom instance method.
 *
 * All other methods are whatever custom code snippets you want to test.
 */
export abstract class AbstractMockAppService {
  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public abstract upgradeClient: any;
  public abstract NAME: string;
  public abstract DESCRIPTION: string;
  public abstract TYPE: MockAppType;
  public abstract LANGUAGE: CodeLanguage;
  public abstract SITES: Record<string, string>;
  public abstract TARGETS: Record<string, string>;
  public abstract GROUPS: string[];
  public abstract CONTEXT: string;
  public abstract HOOKNAMES: Record<string, string>;
  public abstract DECISION_POINTS: Array<Record<string, string>>;
  private mockAppDispatcherSub: Subscription = new Subscription();

  constructor(
    public instanceMockAppName: string,
    public eventBus: EventBusService,
    public clientLibraryService: ClientLibraryService
  ) {
    this.eventBus.mockApp$.subscribe((mockAppName) => {
      if (mockAppName === instanceMockAppName) {
        this.mockAppDispatcherSub = this.eventBus.mockClientAppHook$.subscribe((hookEvent) => {
          this.routeHook(hookEvent);
        });
      } else {
        this.mockAppDispatcherSub.unsubscribe();
      }
    });
  }

  /**
   * A Mock App instance must implement 2 methods:
   *
   * 1. getAppInterfaceModel(): MockClientAppInterfaceModel
   * 2. routeHook(hookEvent: ClientAppHook): void
   */

  public abstract getAppInterfaceModel(): MockClientAppInterfaceModel;

  public abstract routeHook(hookEvent: ClientAppHook): void;

  public constructUpgradeClient(userId: string): any {
    const apiHostUrl = this.clientLibraryService.getSelectedAPIHostUrl();
    const UpgradeClient: new (...args: any[]) => typeof UpgradeClient =
      this.clientLibraryService.getUpgradeClientConstructor();
    const upgradeClient = new UpgradeClient(userId, apiHostUrl, this.CONTEXT);
    return upgradeClient;
  }
}
