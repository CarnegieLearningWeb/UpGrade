import { CodeLanguage, HookRequestBody, MockAppType, MockClientAppInterfaceModel } from '../../../shared/models';

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
export abstract class AbstractTSBackendMockApp {
  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public abstract upgradeClient: any;
  private UpgradeClientConstructor: any;

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
  public static appInterfaceModel: MockClientAppInterfaceModel;

  constructor(public upgradeClientConstructor?: any) {
    this.UpgradeClientConstructor = upgradeClientConstructor;
  }

  /**
   * A Mock App instance must implement 2 methods:
   *
   * 1. getAppInterfaceModel(): MockClientAppInterfaceModel
   * 2. routeHook(hookEvent: ClientAppHook): void
   */

  public abstract getAppInterfaceModel(): MockClientAppInterfaceModel;

  public abstract routeHook(hookEvent: HookRequestBody): void;

  public constructUpgradeClient(userId: string, apiHostUrl: string): any {
    const UpgradeClient: new (...args: any[]) => typeof UpgradeClient = this.UpgradeClientConstructor;
    const upgradeClient = new UpgradeClient(userId, apiHostUrl, this.CONTEXT);
    return upgradeClient;
  }
}
