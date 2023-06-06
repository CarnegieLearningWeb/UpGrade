import { Injectable } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';
import { EventBusService } from '../services/event-bus.service';
import { ClientAppHook, MockAppType, MockClientAppInterfaceModel } from '../../../../shared/models';

// There's probably a clever way to do this, but getting the right types automatically is tricky

// import { UpgradeClient } from 'upgrade_client_local';
// import { UpgradeClient } from 'upgrade_client_1_1_17';
// import { UpgradeClient } from 'upgrade_client_3_0_18';
// import { UpgradeClient } from 'upgrade_client_4_2_0';

import { AbstractMockAppService } from './abstract-mock-app.service';

@Injectable({
  providedIn: 'root',
})
export class BirthdayPresentAppService extends AbstractMockAppService {
  // public override upgradeClient!: UpgradeClient;
  public override upgradeClient: any;

  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public override NAME = 'Birthday App';
  public override DESCRIPTION = 'Use this app to get presents.';
  public override TYPE: MockAppType = 'frontend';
  public override SITES = {
    GET_PRESENT: 'get_present',
  };
  public override TARGETS = {
    ORANGE_PRESENT: 'orange_present',
    PURPLE_PRESENT: 'purple_present',
    GREEN_PRESENT: 'green_present',
  };
  public override GROUPS = ['schoolId', 'classId', 'instructorId'];
  public override CONTEXT = 'add'; // what should this be really?
  public override HOOKNAMES = {
    LOGIN: 'login',
    VISIT_DP: 'visit_dp',
    LOG: 'log',
  };
  public override DECISION_POINTS = [
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.ORANGE_PRESENT },
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.PURPLE_PRESENT },
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.GREEN_PRESENT },
  ];

  constructor(public override clientLibraryService: ClientLibraryService, public override eventBus: EventBusService) {
    super('Birthday App', eventBus, clientLibraryService);
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
          description:
            'Will dispatch MARK event and receive either a good or bad present, depending on condition received.',
        },
        {
          name: this.HOOKNAMES.LOG,
          description: 'will log the user metrics!',
        },
      ],
      decisionPoints: this.DECISION_POINTS,
      groups: this.GROUPS,
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
        {
          label: 'Log some stuff',
          hookName: this.HOOKNAMES.LOG,
        },
      ],
    };
  }

  /******************* "routeHook" required to route requests from tester-app to simulated client code snippets ********************/
  public routeHook(hookEvent: ClientAppHook) {
    const { name, user } = hookEvent;
    if (name === '') return;

    if (!user || !user.id) {
      throw new Error('No user found in hookEvent');
    }

    if (name === this.HOOKNAMES.LOGIN && user?.id) {
      this.login(user.id);
    } else if (name === this.HOOKNAMES.VISIT_DP) {
      const { site, target } = hookEvent.payload;
      this.visitDP({ site, target });
    } else if (name === this.HOOKNAMES.LOG) {
      console.log(hookEvent.payload);
      this.sendMetrics();
    } else {
      throw new Error(`No hook found for hookName: ${name}`);
    }
  }

  /******************* simulated client app code ****************************************************/

  private async login(userId: string) {
    console.log('login hook called:', userId)
    this.upgradeClient = this.constructUpgradeClient(userId);
    console.log({ upgradeClient: this.upgradeClient });

    try {
      const initResponse = await this.upgradeClient.init();
      const assignResponse = await this.upgradeClient.getAllExperimentConditions();
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

    const assignment = await this.upgradeClient.getDecisionPointAssignment(site, target);
    console.log({ assignment });
    try {
      const markResponse = await this.upgradeClient.markExperimentPoint(
        site,
        assignment?.getCondition(),
        'applied',
        target
      );
      console.log({ markResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async sendMetrics() {
    console.log('sending metrics');
  }
}
