import { Injectable } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';
import { EventBusService } from '../services/event-bus.service';
import { ClientAppHook, CodeLanguage, MockAppType, MockClientAppInterfaceModel } from '../../../../shared/models';
import { MOCK_APP_NAMES } from '../../../../shared/constants';
import { AbstractMockAppService } from './abstract-mock-app.service';
import { UpgradeClient } from 'upgrade_client_1_1_7';

@Injectable({
  providedIn: 'root',
})
export class MockPortalService extends AbstractMockAppService {
  public upgradeClient!: UpgradeClient;

  /******************* required metadata to describe the mock app and its callable hooks ********************/

  public NAME = MOCK_APP_NAMES.PORTAL_APP;
  public DESCRIPTION = 'Mimics current usage of library in Portal';
  public TYPE: MockAppType = 'frontend';
  public LANGUAGE: CodeLanguage = 'ts';
  public SITES = {};
  public TARGETS = {};
  public CONTEXT = 'portal';
  public GROUPS = ['schoolId', 'classId', 'instructorId'];
  public HOOKNAMES = {
    LOGIN: 'login',
  };
  public DECISION_POINTS = [];

  constructor(public override clientLibraryService: ClientLibraryService, public override eventBus: EventBusService) {
    super(MOCK_APP_NAMES.PORTAL_APP, eventBus, clientLibraryService);
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
          description: 'Will dispatch init, setGroupMembership, and assign methods.',
        },
      ],
      decisionPoints: this.DECISION_POINTS,
      groups: this.GROUPS,
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

    if (!user || !user.id) {
      throw new Error('No user found in hookEvent');
    }

    if (name === this.HOOKNAMES.LOGIN && user?.id && user?.groups) {
      this.login(user.id, user.groups);
    } else {
      throw new Error(`No hook found for hookName: ${name}`);
    }
  }

  /******************* simulated client app code ****************************************************/

  private async login(userId: string, userGroups: Record<string, string[]>) {
    console.log({ userGroups });
    const memberships = new Map<string, string[]>();

    for (const group in userGroups) {
      memberships.set(group, userGroups[group]);
    }

    console.log({ memberships });

    this.upgradeClient = this.constructUpgradeClient(userId);
    this.upgradeClient
      .init()
      .then((initResponse: any) => { 
        console.log('initResponse', initResponse);
        return this.upgradeClient.setGroupMembership(memberships);
      })
      .then((groupResponse: any) => {
        console.log('groupResponse', groupResponse);
        return this.upgradeClient.getAllExperimentConditions(this.CONTEXT);
      })
      .then((assignmentResponse: any) => {
        console.log('assignmentResponse', assignmentResponse);
      })
      .catch((err: any) => console.error(err));
  }
}
