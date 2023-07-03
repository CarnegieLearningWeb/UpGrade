import { Injectable } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';
import { EventBusService } from '../services/event-bus.service';
import {
  ClientAppHook,
  CodeLanguage,
  MockAppType,
  MockClientAppInterfaceModel,
  MockClientAppUser,
} from '../../../../shared/models';
import { CaliperEnvelope } from '../../../../../../types/src';

// There's probably a clever way to do this, but getting the right types automatically is tricky

import UpgradeClient from 'upgrade_client_local/dist/browser';
// import { UpgradeClient } from 'upgrade_client_1_1_7';
// import * as UpgradeClient_1_1_8 from "upgrade_client_1_1_8/dist/browser"
// import { UpgradeClient } from 'upgrade_client_3_0_18';

import { AbstractMockAppService } from './abstract-mock-app.service';
import { MOCK_APP_NAMES } from '../../../../shared/constants';

export enum MARKED_DECISION_POINT_STATUS {
  CONDITION_APPLIED = 'condition applied',
  CONDITION_FAILED_TO_APPLY = 'condition not applied',
  NO_CONDITION_ASSIGNED = 'no condition assigned',
}

@Injectable({
  providedIn: 'root',
})
export class GeneralTestForVersion5Service extends AbstractMockAppService {
  public override upgradeClient!: UpgradeClient;
  // public upgradeClient: any;

  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public NAME = MOCK_APP_NAMES.GENERAL_TS_FRONTEND_5_0;
  public DESCRIPTION = 'Regression testing for version 5';
  public TYPE: MockAppType = 'frontend';
  public LANGUAGE: CodeLanguage = 'ts';
  public SITES = {
    TEST: 'test',
  };
  public TARGETS = {
    TARGET_1: 'target_1',
    TARGET_2: 'target_2',
  };
  public GROUPS = ['schoolId', 'classId', 'instructorId'];
  public CONTEXT = 'add'; // what should this be really?
  public HOOKNAMES = {
    INIT: 'init',
    ASSIGN: 'assign',
    MARK_EXPERIMENT_POINT: 'markExperimentPoint',
    GROUP_MEMBERSHIP: 'update_group',
    WORKING_GROUPS: 'update_working_group',
    SET_ALT_USER_IDS: 'setAltUserIds',
    LOG: 'log',
    LOG_CALIPER: 'log_caliper',
  };
  public DECISION_POINTS = [
    { site: this.SITES.TEST, target: this.TARGETS.TARGET_1 },
    { site: this.SITES.TEST, target: this.TARGETS.TARGET_2 },
  ];

  constructor(public override clientLibraryService: ClientLibraryService, public override eventBus: EventBusService) {
    super(MOCK_APP_NAMES.GENERAL_TS_FRONTEND_5_0, eventBus, clientLibraryService);
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
          name: this.HOOKNAMES.INIT,
          description: 'Dispatches .init()',
        },
        {
          name: this.HOOKNAMES.ASSIGN,
          description: 'Dispatches .getAllExperimentConditions()',
        },
        {
          name: this.HOOKNAMES.MARK_EXPERIMENT_POINT,
          description: 'Dispatches .markExperimentPoint() for target 1, control condition',
        },
        {
          name: this.HOOKNAMES.SET_ALT_USER_IDS,
          description: 'Dispatches .setAltUserIds() for user',
        },
        {
          name: this.HOOKNAMES.GROUP_MEMBERSHIP,
          description: 'Dispatches .setGroupMembership() for user',
        },
        {
          name: this.HOOKNAMES.WORKING_GROUPS,
          description: 'Dispatches .setWorkingGroup() for user',
        },
        {
          name: this.HOOKNAMES.LOG,
          description: 'Dispatches .log() for user',
        },
        {
          name: this.HOOKNAMES.LOG_CALIPER,
          description: 'Dispatches .logCaliper() for user',
        },
      ],
      decisionPoints: this.DECISION_POINTS,
      groups: this.GROUPS,
      buttons: [
        {
          label: 'init',
          hookName: this.HOOKNAMES.INIT,
        },
        {
          label: 'getAllExperimentConditions',
          hookName: this.HOOKNAMES.ASSIGN,
        },
        {
          label: 'markExperimentPoint',
          hookName: this.HOOKNAMES.MARK_EXPERIMENT_POINT,
        },
        {
          label: 'setAltUserIds',
          hookName: this.HOOKNAMES.SET_ALT_USER_IDS,
        },
        {
          label: 'setWorkingGroup',
          hookName: this.HOOKNAMES.WORKING_GROUPS,
        },
        {
          label: 'setGroupMemberhip',
          hookName: this.HOOKNAMES.GROUP_MEMBERSHIP,
        },
        {
          label: 'log',
          hookName: this.HOOKNAMES.LOG,
        },
        {
          label: 'logCaliper',
          hookName: this.HOOKNAMES.LOG_CALIPER,
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

    if (name === this.HOOKNAMES.INIT && user?.id) {
      this.doInit(user.id);
    } else if (name === this.HOOKNAMES.ASSIGN) {
      this.doAssign();
    } else if (name === this.HOOKNAMES.MARK_EXPERIMENT_POINT) {
      this.doMark();
    } else if (name === this.HOOKNAMES.SET_ALT_USER_IDS) {
      this.doUserAliases(user);
    } else if (name === this.HOOKNAMES.GROUP_MEMBERSHIP) {
      this.doGroupMembership(user);
    } else if (name === this.HOOKNAMES.WORKING_GROUPS) {
      this.doWorkingGroupMembership(user);
    } else if (name === this.HOOKNAMES.LOG) {
      this.doLog(user);
    } else if (name === this.HOOKNAMES.LOG_CALIPER) {
      this.doLogCaliper(user);
    } else {
      throw new Error(`No hook found for hookName: ${name}`);
    }
  }

  /******************* simulated client app code ****************************************************/

  private async doInit(userId: string) {
    console.log('login hook called:', userId);
    this.upgradeClient = this.constructUpgradeClient(userId);
    console.log({ upgradeClient: this.upgradeClient });

    try {
      const initResponse = await this.upgradeClient.init();
      console.log({ initResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doAssign() {
    if (!this.upgradeClient) {
      throw new Error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    try {
      const assignmentsResponse = await this.upgradeClient.getAllExperimentConditions();
      console.log({ assignmentsResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doMark() {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    try {
      const markResponse = await this.upgradeClient.markExperimentPoint(
        this.SITES.TEST,
        this.TARGETS.TARGET_1,
        'control',
        MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
      );
      console.log({ markResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doUserAliases(user: MockClientAppUser) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    if (!user || !user.userAliases) {
      console.error('User info is missing userAliases:', user);
    }
    try {
      const useraliasesResponse = await this.upgradeClient.setAltUserIds(user.userAliases);
      console.log({ useraliasesResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doGroupMembership(user: MockClientAppUser) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    if (!user || !user.groups) {
      console.error('User info is missing groups:', user);
    }
    try {
      const groupMembershipResponse = await this.upgradeClient.setGroupMembership(user.groups);
      console.log({ groupMembershipResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doWorkingGroupMembership(user: MockClientAppUser) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    if (!user || !user.groups) {
      console.error('User info is missing working groups:', user);
    }
    try {
      const workingGroupMembershipResponse = await this.upgradeClient.setWorkingGroup(user.workingGroup);
      console.log({ workingGroupMembershipResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doLog(user: MockClientAppUser) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    if (!user || !user.id) {
      console.error('User info is missing id:', user);
    }
    const logRequest = [
      {
        userId: user.id,
        timestamp: '2022-03-03T19:49:00.496',
        metrics: {
          attributes: {
            totalTimeSeconds: 41834,
            totalMasteryWorkspacesCompleted: 15,
            totalConceptBuildersCompleted: 17,
            totalMasteryWorkspacesGraduated: 15,
            totalSessions: 50,
            totalProblemsCompleted: 249,
          },
          groupedMetrics: [
            {
              groupClass: 'conceptBuilderWorkspace',
              groupKey: 'graphs_of_functions',
              groupUniquifier: '2022-02-03T19:48:53.861Z',
              attributes: {
                timeSeconds: 488,
                hintCount: 2,
                errorCount: 15,
                completionCount: 1,
                workspaceCompletionStatus: 'GRADUATED',
                problemsCompleted: 4,
              },
            },
          ],
        },
      },
    ];
    try {
      const logResponse = await this.upgradeClient.log(logRequest);
      console.log({ logResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doLogCaliper(user: MockClientAppUser) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    if (!user || !user.id) {
      console.error('User info is missing id:', user);
    }
    const logRequest: CaliperEnvelope = {
      sensor: 'test',
      sendTime: 'test',
      dataVersion: 'test',
      data: [],
    };
    try {
      const logResponse = await this.upgradeClient.logCaliper(logRequest);
      console.log({ logResponse });
    } catch (err) {
      console.error(err);
    }
  }
}
