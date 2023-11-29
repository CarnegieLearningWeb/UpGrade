import { AbstractTSBackendMockApp } from './AbstractTSBackendMockApp';
import UpgradeClient from 'upgrade_client_1_1_8/dist/node';

import { MOCK_APP_NAMES } from '../../../shared/constants';

import {
  MockAppType,
  CodeLanguage,
  MockClientAppInterfaceModel,
  HookRequestBody,
  HookResponse,
} from '../../../shared/models.js';

export enum MARKED_DECISION_POINT_STATUS {
  CONDITION_APPLIED = 'condition applied',
  CONDITION_FAILED_TO_APPLY = 'condition not applied',
  NO_CONDITION_ASSIGNED = 'no condition assigned',
}

export class GeneralTSBackendVersion1 extends AbstractTSBackendMockApp {
  // implement required abstract properties
  public override upgradeClient!: UpgradeClient;
  // public upgradeClient: any;

  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public NAME = MOCK_APP_NAMES.GENERAL_TS_BACKEND_1;
  public DESCRIPTION = 'Regression testing for lib version 1';
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
  public CONTEXT = 'assign-prog'; // what should this be really?
  public HOOKNAMES = {
    INIT: 'init',
    ASSIGN: 'assign',
    MARK_EXPERIMENT_POINT: 'markExperimentPoint',
    GROUP_MEMBERSHIP: 'setGroupMembership',
    WORKING_GROUPS: 'setWorkingGroup',
    SET_ALT_USER_IDS: 'setAltUserIds',
    LOG: 'log',
  };
  public DECISION_POINTS = [
    { site: this.SITES.TEST, target: this.TARGETS.TARGET_1 },
    { site: this.SITES.TEST, target: this.TARGETS.TARGET_2 },
  ];

  constructor(UpgradeClientConstructor?: any) {
    super(UpgradeClientConstructor);
  }

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
      ],
      decisionPoints: this.DECISION_POINTS,
      groups: this.GROUPS,
      buttons: [
        {
          label: this.HOOKNAMES.INIT,
          hookName: this.HOOKNAMES.INIT,
        },
        {
          label: this.HOOKNAMES.ASSIGN,
          hookName: this.HOOKNAMES.ASSIGN,
        },
        {
          label: this.HOOKNAMES.MARK_EXPERIMENT_POINT,
          hookName: this.HOOKNAMES.MARK_EXPERIMENT_POINT,
        },
        {
          label: this.HOOKNAMES.SET_ALT_USER_IDS,
          hookName: this.HOOKNAMES.SET_ALT_USER_IDS,
        },
        {
          label: this.HOOKNAMES.WORKING_GROUPS,
          hookName: this.HOOKNAMES.WORKING_GROUPS,
        },
        {
          label: this.HOOKNAMES.GROUP_MEMBERSHIP,
          hookName: this.HOOKNAMES.GROUP_MEMBERSHIP,
        },
        {
          label: this.HOOKNAMES.LOG,
          hookName: this.HOOKNAMES.LOG,
        },
      ],
    };
  }

  /******************* "routeHook" required to route requests from tester-app to simulated client code snippets ********************/
  public async routeHook(hookEvent: HookRequestBody): Promise<HookResponse> {
    const { name, user } = hookEvent;
    if (name === '')
      return {
        hookReceived: hookEvent,
        response: {
          error: 'No hook name provided',
        },
      };

    if (!user || !user.id) {
      return {
        hookReceived: hookEvent,
        response: {
          error: 'No user id provided',
        },
      };
    }

    if (name === this.HOOKNAMES.INIT && user?.id) {
      return await this.doInit(hookEvent);
    } else if (name === this.HOOKNAMES.ASSIGN) {
      return await this.doAssign(hookEvent);
    } else if (name === this.HOOKNAMES.MARK_EXPERIMENT_POINT) {
      return await this.doMark(hookEvent);
    } else if (name === this.HOOKNAMES.SET_ALT_USER_IDS) {
      return await this.doUserAliases(hookEvent);
    } else if (name === this.HOOKNAMES.GROUP_MEMBERSHIP) {
      return await this.doGroupMembership(hookEvent);
    } else if (name === this.HOOKNAMES.WORKING_GROUPS) {
      return await this.doWorkingGroupMembership(hookEvent);
    } else if (name === this.HOOKNAMES.LOG) {
      return await this.doLog(hookEvent);
    } else {
      return {
        hookReceived: hookEvent,
        response: {
          error: `No hook found for hookName: ${name}`,
        },
      };
    }
  }

  /******************* simulated client app code ****************************************************/

  private async doInit(hookEvent: HookRequestBody): Promise<HookResponse> {
    console.log(`'doInit called:'`, hookEvent);
    this.upgradeClient = this.constructUpgradeClient(hookEvent.user.id, hookEvent.apiHostUrl);
    console.log({ upgradeClient: this.upgradeClient });

    try {
      const initResponse = await this.upgradeClient.init();
      console.log({ initResponse });
      return {
        hookReceived: hookEvent,
        response: initResponse,
      };
    } catch (err) {
      console.error(err);
      return {
        hookReceived: hookEvent,
        response: err,
      };
    }
  }

  private async doAssign(hookEvent: HookRequestBody): Promise<HookResponse> {
    console.log('doAssign called:', hookEvent);
    this.upgradeClient = this.constructUpgradeClient(hookEvent.user.id, hookEvent.apiHostUrl);

    try {
      const assignmentsResponse = await this.upgradeClient.getAllExperimentConditions(this.CONTEXT);
      console.log({ assignmentsResponse });
      return {
        hookReceived: hookEvent,
        response: assignmentsResponse,
      };
    } catch (err) {
      console.error(err);
      return {
        hookReceived: hookEvent,
        response: err,
      };
    }
  }

  private async doMark(hookEvent: HookRequestBody): Promise<HookResponse> {
    console.log('doMark called:', hookEvent);
    this.upgradeClient = this.constructUpgradeClient(hookEvent.user.id, hookEvent.apiHostUrl);

    try {
      const markResponse = await this.upgradeClient.markExperimentPoint(
        this.SITES.TEST,
        'control',
        this.TARGETS.TARGET_1,
      );
      console.log({ markResponse });
      return {
        hookReceived: hookEvent,
        response: markResponse,
      };
    } catch (err) {
      console.error(err);
      return {
        hookReceived: hookEvent,
        response: err,
      };
    }
  }

  private async doUserAliases(hookEvent: HookRequestBody): Promise<HookResponse> {
    console.log('doUserAliases called:', hookEvent);

    this.upgradeClient = this.constructUpgradeClient(hookEvent.user.id, hookEvent.apiHostUrl);

    try {
      const useraliasesResponse = await this.upgradeClient.setAltUserIds(hookEvent.user.userAliases);
      console.log({ useraliasesResponse });
      return {
        hookReceived: hookEvent,
        response: useraliasesResponse,
      };
    } catch (err) {
      console.error(err);
      return {
        hookReceived: hookEvent,
        response: err,
      };
    }
  }

  private async doGroupMembership(hookEvent: HookRequestBody): Promise<HookResponse> {
    console.log('doGroupMembership called:', hookEvent);

    this.upgradeClient = this.constructUpgradeClient(hookEvent.user.id, hookEvent.apiHostUrl);

    if (!hookEvent.user || !hookEvent.user.groups) {
      console.error('User info is missing groups:', hookEvent.user);
    }

    const groupMap = new Map<string, Array<string>>();
    for (const group in hookEvent.user.groups) {
      groupMap.set(group, hookEvent.user.groups[group]);
    }

    try {
      const groupMembershipResponse = await this.upgradeClient.setGroupMembership(groupMap);
      console.log({ groupMembershipResponse });
      return {
        hookReceived: hookEvent,
        response: groupMembershipResponse,
      };
    } catch (err) {
      console.error(err);
      return {
        hookReceived: hookEvent,
        response: err,
      };
    }
  }

  private async doWorkingGroupMembership(hookEvent: HookRequestBody): Promise<HookResponse> {
    console.log('doWorkingGroupMembership', hookEvent);

    this.upgradeClient = this.constructUpgradeClient(hookEvent.user.id, hookEvent.apiHostUrl);

    const workingGroupMap = new Map<string, string>();


    try {
      const workingGroupMembershipResponse = await this.upgradeClient.setWorkingGroup(workingGroupMap);
      console.log({ workingGroupMembershipResponse });
      return {
        hookReceived: hookEvent,
        response: workingGroupMembershipResponse,
      };
    } catch (err) {
      console.error(err);
      return {
        hookReceived: hookEvent,
        response: err,
      };
    }
  }

  private async doLog(hookEvent: HookRequestBody): Promise<HookResponse> {
    console.log('doLog', hookEvent);
    this.upgradeClient = this.constructUpgradeClient(hookEvent.user.id, hookEvent.apiHostUrl);

    const logRequest = [
      {
        userId: hookEvent.user.id,
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
      return {
        hookReceived: hookEvent,
        response: logResponse,
      };
    } catch (err) {
      console.error(err);
      return {
        hookReceived: hookEvent,
        response: err,
      };
    }
  }
}
