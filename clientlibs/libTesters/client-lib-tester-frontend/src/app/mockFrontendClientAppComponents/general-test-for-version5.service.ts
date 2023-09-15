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

import UpgradeClient, { Assignment, UpGradeClientInterfaces } from 'upgrade_client_local/dist/browser';
import { CaliperEnvelope, IExperimentAssignmentv5 } from 'upgrade_client_local/dist/types/src'
import { AbstractMockAppService } from './abstract-mock-app.service';
import { MOCK_APP_NAMES } from '../../../../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class GeneralTestForVersion5Service extends AbstractMockAppService {
  public override upgradeClient!: UpgradeClient;

  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public NAME = MOCK_APP_NAMES.GENERAL_TS_FRONTEND_5_0;
  public DESCRIPTION = 'Regression testing for version 5';
  public TYPE: MockAppType = 'frontend';
  public LANGUAGE: CodeLanguage = 'ts';
  public SITES = {
    TEST: 'SelectSection',
  };
  public TARGETS = {
    TARGET_1: 'targetC',
    TARGET_2: 'target_2',
  };
  public CONDITIONS = {
    CONDITION_1: 'control',
    CONDITION_2: 'variant_X',
    CONDITION_3: 'condition3',
    CONDITION_4: 'condition4',
  }
  public GROUPS = ['schoolId', 'classId', 'instructorId'];
  public CONTEXT = 'assign-prog'; // what should this be really?
  public HOOKNAMES = {
    INIT: 'init',
    ASSIGN: 'assign',
    DP_ASSIGNMENT_TARGET_1: 'getDecisionPointAssignment1',
    DP_ASSIGNMENT_TARGET_2: 'getDecisionPointAssignment2',
    MARK_ASSIGNMENT_TARGET_1_CONDITION_1: 'doAssignmentMark',
    MARK_CLIENT_TARGET_1_CONDITION_1: 'doClientMark',
    MARK_TARGET_1_CONDITION_3: 'markTarget1Condition3',
    MARK_TARGET_1_CONDITION_4: 'markTarget1Condition4',
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
          name: this.HOOKNAMES.DP_ASSIGNMENT_TARGET_1,
          description: 'Dispatches .getDecisionPointAssignment() for target_1',
        },
        {
          name: this.HOOKNAMES.DP_ASSIGNMENT_TARGET_2,
          description: 'Dispatches .getDecisionPointAssignment() for target_2',
        },
        {
          name: this.HOOKNAMES.MARK_EXPERIMENT_POINT,
          description: 'Dispatches .markExperimentPoint() for target 1, control condition',
        },
        {
          name: this.HOOKNAMES.MARK_ASSIGNMENT_TARGET_1_CONDITION_1,
          description: 'Dispatches .markExperimentPoint() for target 1, condition 1',
        },
        {
          name: this.HOOKNAMES.MARK_CLIENT_TARGET_1_CONDITION_1,
          description: 'Dispatches .markExperimentPoint() for target 1, condition 2',
        },
        {
          name: this.HOOKNAMES.MARK_TARGET_1_CONDITION_3,
          description: 'Dispatches .markExperimentPoint() for target 1, condition 3',
        },
        {
          name: this.HOOKNAMES.MARK_TARGET_1_CONDITION_4,
          description: 'Dispatches .markExperimentPoint() for target 1, condition 4',
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
          label: 'getAssignment: target1',
          hookName: this.HOOKNAMES.DP_ASSIGNMENT_TARGET_1,
        },
        {
          label: 'getAssignment: target2',
          hookName: this.HOOKNAMES.DP_ASSIGNMENT_TARGET_2,
        },
        {
          label: 'mark: target1, condition1',
          hookName: this.HOOKNAMES.MARK_ASSIGNMENT_TARGET_1_CONDITION_1,
        },
        {
          label: 'mark: target1, condition2',
          hookName: this.HOOKNAMES.MARK_CLIENT_TARGET_1_CONDITION_1,
        },
        {
          label: 'mark: target1, condition3',
          hookName: this.HOOKNAMES.MARK_TARGET_1_CONDITION_3,
        },
        {
          label: 'mark: target1, condition4',
          hookName: this.HOOKNAMES.MARK_TARGET_1_CONDITION_4,
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
    } else if (name === this.HOOKNAMES.DP_ASSIGNMENT_TARGET_1) {
      this.doGetDecisionPointAssignment(this.TARGETS.TARGET_1);
    } else if (name === this.HOOKNAMES.DP_ASSIGNMENT_TARGET_2) {
      this.doGetDecisionPointAssignment(this.TARGETS.TARGET_2);
    } else if (name === this.HOOKNAMES.MARK_ASSIGNMENT_TARGET_1_CONDITION_1) {
      this.doAssignmentMark();
    } else if (name === this.HOOKNAMES.MARK_CLIENT_TARGET_1_CONDITION_1) {
      this.doClientMark(this.CONDITIONS.CONDITION_1);
    } else if (name === this.HOOKNAMES.MARK_TARGET_1_CONDITION_3) {
      this.doClientMark(this.CONDITIONS.CONDITION_3);
    } else if (name === this.HOOKNAMES.MARK_TARGET_1_CONDITION_4) {
      this.doClientMark(this.CONDITIONS.CONDITION_4);
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
      const assignmentsResponse: IExperimentAssignmentv5[] = await this.upgradeClient.getAllExperimentConditions();
      console.log({ assignmentsResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doGetDecisionPointAssignment(target: string) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    try {
      const dpAssignmentsResponse: Assignment = await this.upgradeClient.getDecisionPointAssignment(
        this.SITES.TEST,
        target
      );

      if (!dpAssignmentsResponse) {
        console.log({ dpAssignmentsResponse });
        return;
      }

      const condition = dpAssignmentsResponse.getCondition();
      const payload = dpAssignmentsResponse.getPayload();
      const getExperimentType = dpAssignmentsResponse.getExperimentType();
      const factors = dpAssignmentsResponse.factors;

      if (factors) {
        const factorLevel = dpAssignmentsResponse.getFactorLevel(factors[0]);
        const getFactorPayload = dpAssignmentsResponse.getFactorPayload(factors[0]);
        console.log({ factorLevel });
        console.log({ getFactorPayload });
      }

      console.log({ condition });
      console.log({ payload });
      console.log({ getExperimentType });
      console.log({ factors });
      console.log({ dpAssignmentsResponse });
      console.log('condition:', dpAssignmentsResponse.getCondition());
    } catch (err) {
      console.error(err);
    }
  }

  private async doClientMark(condition: string, uniquifier?: string) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    try {
      const markResponse: UpGradeClientInterfaces.IMarkExperimentPoint = await this.upgradeClient.markDecisionPoint(
        this.SITES.TEST,
        this.TARGETS.TARGET_1,
        'condition',
        UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        uniquifier,
        'errororororor'
      );
      console.log({ markResponse });
    } catch (err) {
      console.error(err);
    }
  }

  private async doAssignmentMark(uniquifier?: string) {
    if (!this.upgradeClient) {
      console.error('No upgradeClient found. Maybe you need to run login hook first?');
    }
    try {
      const assignment: Assignment = await this.upgradeClient.getDecisionPointAssignment(
        this.SITES.TEST,
        this.TARGETS.TARGET_1
      );
      const markResponse = await assignment.markDecisionPoint(
        UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
        uniquifier
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
      const useraliasesResponse: UpGradeClientInterfaces.IExperimentUserAliases[] =
        await this.upgradeClient.setAltUserIds(user.userAliases);
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
      const groupMembershipResponse: UpGradeClientInterfaces.IUser = await this.upgradeClient.setGroupMembership(
        user.groups
      );
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
      const workingGroupMembershipResponse: UpGradeClientInterfaces.IUser = await this.upgradeClient.setWorkingGroup(
        user.workingGroup
      );
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
      const logResponse: UpGradeClientInterfaces.ILog[] = await this.upgradeClient.log(logRequest);
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
