import { Injectable } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';
import { EventBusService } from '../services/event-bus.service';
import { ClientAppHook, CodeLanguage, MockAppType, MockClientAppInterfaceModel } from '../../../../shared/models';

// There's probably a clever way to do this, but getting the right types automatically is tricky

// import { UpgradeClient } from 'upgrade_client_local';
// import { UpgradeClient } from 'upgrade_client_1_1_17';
// import { UpgradeClient } from 'upgrade_client_3_0_18';
// import { UpgradeClient } from 'upgrade_client_4_2_0';

import { AbstractMockAppService } from './abstract-mock-app.service';
import { MOCK_APP_NAMES } from '../../../../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class BirthdayPresentAppService extends AbstractMockAppService {
  // public override upgradeClient!: UpgradeClient;
  public upgradeClient: any;

  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public NAME = MOCK_APP_NAMES.BDAY_APP;
  public DESCRIPTION = 'Use this app to get presents.';
  public TYPE: MockAppType = 'frontend';
  public LANGUAGE: CodeLanguage = 'ts';
  public SITES = {
    GET_PRESENT: 'get_present',
  };
  public TARGETS = {
    ORANGE_PRESENT: 'orange_present',
    PURPLE_PRESENT: 'purple_present',
    GREEN_PRESENT: 'green_present',
  };
  public GROUPS = ['schoolId', 'classId', 'instructorId'];
  public CONTEXT = 'add'; // what should this be really?
  public HOOKNAMES = {
    LOGIN: 'login',
    VISIT_DP: 'visit_dp',
  };
  public DECISION_POINTS = [
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.ORANGE_PRESENT },
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.PURPLE_PRESENT },
    { site: this.SITES.GET_PRESENT, target: this.TARGETS.GREEN_PRESENT },
  ];

  constructor(public override clientLibraryService: ClientLibraryService, public override eventBus: EventBusService) {
    super(MOCK_APP_NAMES.BDAY_APP, eventBus, clientLibraryService);
  }

  /******************* "getAppInterfaceModel" required to give tester app a model to construct an interface to use this 'app' ********************/

  public getAppInterfaceModel(): MockClientAppInterfaceModel {
    return {
      name: this.NAME,
      description: this.DESCRIPTION,
      type: this.TYPE,
      language: this.LANGUAGE,
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
}
