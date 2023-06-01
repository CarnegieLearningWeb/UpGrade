import { Injectable } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';
import { EventBusService } from '../services/event-bus.service';
import { ClientAppHook, MockAppType, MockClientAppInterfaceModel } from '../app-models';
import { Subscription } from 'rxjs';

// There's probably a clever way to do this, but getting the right types automatically is tricky

// import { UpgradeClient } from 'upgrade_client_local';
// import { UpgradeClient } from 'upgrade_client_1_1_17';
// import { UpgradeClient } from 'upgrade_client_3_0_18';
// import { UpgradeClient } from 'upgrade_client_4_2_0';

@Injectable({
  providedIn: 'root',
})
export class MockPortalService {
  // private upgradeClient!: UpgradeClient;
  private upgradeClient!: any;

  /******************* required metadata to describe the mock app and its callable hooks ********************/

  private NAME = 'Mock Portal';
  private DESCRIPTION = 'Mimics current usage of library in Portal';
  private TYPE: MockAppType = 'frontend';
  private SITES = {};
  private TARGETS = {};
  private CONTEXT = 'portal';
  private GROUPS = ['schoolId', 'classId', 'instructorId'];
  public HOOKNAMES = {
    LOGIN: 'login',
  };
  public DECISION_POINTS = [];
  private mockAppDispatcherSub = new Subscription();

  constructor(private clientLibraryService: ClientLibraryService, private eventBus: EventBusService) {
    this.eventBus.mockApp$.subscribe((mockAppName) => {
      if (mockAppName === this.NAME) {
        this.mockAppDispatcherSub = this.eventBus.mockClientAppHookDispatcher$.subscribe((hookEvent) => {
          this.routeHook(hookEvent);
        });
      } else {
        this.mockAppDispatcherSub.unsubscribe();
      }
    });
  }

  /******************* "getAppInterfaceModel" required to give tester app a model to construct an interface to use this 'app' ********************/

  public getAppInterfaceModel(): MockClientAppInterfaceModel {
    return {
      name: this.NAME,
      description: this.DESCRIPTION,
      type: this.TYPE,
      hooks: [
        {
          name: this.HOOKNAMES.LOGIN,
          description: 'Will dispatch init, setGroupMembership, and assign methods.',
        },
      ],
      decisionPoints: this.DECISION_POINTS,
      groups: ['schoolId', 'classId', 'instructorId'],
      buttons: [
        {
          label: 'Login',
          hookName: this.HOOKNAMES.LOGIN,
        },
      ],
    };
  }

  /******************* "routeHook" required to route requests from tester-app to simulated client code snippets ********************/
  public routeHook(hookEvent: ClientAppHook) {
    const { name, user } = hookEvent;
    if (name === '') return;

    if (!user) {
      throw new Error('No user found in hookEvent');
    }

    if (name === this.HOOKNAMES.LOGIN && user?.id) {
      this.login(user.id);
    } else {
      throw new Error(`No hook found for hookName: ${name}`);
    }
  }

  private constructUpgradeClient(userId: string): any {
    const apiHostUrl = this.clientLibraryService.getSelectedAPIHostUrl();
    const UpgradeClient: new (...args: any[]) => typeof UpgradeClient =
      this.clientLibraryService.getUpgradeClientConstructor();
    const upgradeClient = new UpgradeClient(userId, apiHostUrl);
    return upgradeClient;
  }

  /******************* simulated client app code ****************************************************/

  private async login(userId: string) {
    const memberships = new Map<string, string[]>();

    this.upgradeClient = this.constructUpgradeClient(userId);
    this.upgradeClient
      .init()
      .then(() => this.upgradeClient.setGroupMembership(memberships))
      .then(() => this.upgradeClient.getAllExperimentConditions('portal'))
      .catch((err: any) => console.error(err));
  }
}
