import { Injectable } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';
import { EventBusService } from '../services/event-bus.service';
import { ClientAppHook, MockAppType, MockClientAppInterfaceModel } from '../app-models';

@Injectable({
  providedIn: 'root',
})
export class BirthdayPresentAppService {
  private upgradeClient: any;

  /******************* required metadata to describe the mock app and its callable hooks ********************/

  private NAME = 'Birthday App';
  private DESCRIPTION = 'Use this app to get presents.';
  private TYPE: MockAppType = 'frontend';
  private SITES = {
    GET_PRESENT: 'get_present',
  };
  private TARGETS = {
    ORANGE_PRESENT: 'orange_present',
    PURPLE_PRESENT: 'purple_present',
    GREEN_PRESENT: 'green_present',
  };
  private CONTEXT = 'test-bday';
  public HOOKNAMES = {
    LOGIN: 'login',
    VISIT_DP: 'visit_dp',
  };
  public DECISION_POINTS = [
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.ORANGE_PRESENT },
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.PURPLE_PRESENT },
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.GREEN_PRESENT },
  ];

  constructor(private clientLibraryService: ClientLibraryService, private eventBus: EventBusService) {
    this.eventBus.mockClientAppHookDispatcher$.subscribe((hookEvent) => {
      this.routeHook(hookEvent);
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
          description: 'Will dispatch INIT and ASSIGN events. No payload needed from test service.',
        },
        {
          name: this.HOOKNAMES.VISIT_DP,
          description: 'Will dispatch MARK event',
        },
      ],
      decisionPoints: this.DECISION_POINTS,
      buttons: [
        {
          label: 'Login',
          hookName: this.HOOKNAMES.LOGIN,
        },
        {
          label: 'Visit Orange Present Decision Point',
          hookName: this.HOOKNAMES.VISIT_DP,
          props: this.DECISION_POINTS[0],
        },
        {
          label: 'Visit Purple Present Decision Point',
          hookName: this.HOOKNAMES.VISIT_DP,
          props: this.DECISION_POINTS[1],
        },
        {
          label: 'Visit Green Present Decision Point',
          hookName: this.HOOKNAMES.VISIT_DP,
          props: this.DECISION_POINTS[2],
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
    } else if (name === this.HOOKNAMES.VISIT_DP) {
      const { site, target } = hookEvent.payload;
      this.visitDP({ site, target });
    } else {
      throw new Error(`No hook found for hookName: ${name}`);
    }
  }

  /******************* simulated client app code ****************************************************/

  private constructUpgradeClient(userId: string): any {
    const apiHostUrl = this.clientLibraryService.getSelectedAPIHostUrl();
    const UpgradeClient = this.clientLibraryService.getUpgradeClientConstructor();
    return new UpgradeClient(userId, apiHostUrl);
  }

  private async login(userId: string) {
    this.upgradeClient = this.constructUpgradeClient(userId);
    console.log({ upgradeClient: this.upgradeClient });

    try {
      const initResponse = await this.upgradeClient.init();
      const assignResponse = await this.upgradeClient.getAllExperimentConditions(this.CONTEXT);
      console.log({ initResponse });
      console.log({ assignResponse });
    } catch (err) {
      console.error(err);
    }
  }

  // Note, this "app" assumes that the user is already logged in before mark will be called
  private async visitDP(options: { site: string; target?: string }) {
    if (!this.upgradeClient) {
      throw new Error('No upgradeClient found. Maybe you need to run login hook first?');
    }

    const { site, target } = options;

    const condition = await this.upgradeClient.getDecisionPointAssignment(site, target);
    console.log({ condition });
    try {
      const markResponse = await this.upgradeClient.markExperimentPoint(
        site,
        this.CONTEXT,
        condition?.assignedCondition?.conditionCode,
        target
      );
      console.log({ markResponse });
    } catch (err) {
      console.error(err);
    }
  }
}
