import { Injectable } from '@angular/core';
import { ClientLibraryService } from '../services/client-library.service';
import { EventBusService } from '../services/event-bus.service';
import { ClientAppHook, CodeLanguage, MockAppType, MockClientAppInterfaceModel } from '../../../../shared/models';

// There's probably a clever way to do this, but getting the right types automatically is tricky

import UpgradeClient, { IExperimentAssignment } from 'upgrade_client_1_1_8/dist/browser';

import { AbstractMockAppService } from './abstract-mock-app.service';
import { MOCK_APP_NAMES } from '../../../../shared/constants';

export const QUESTION_SWAP_EXPERIMENT = {
  CONTEXT: 'mathstream',
  SITE: 'DisplayQuestion',
  CONTROL: 'learnosity-item-control',
};

export interface ActiveExperiment {
  originalActivityId: string;
  selectedActivityId: string;
  conditionCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class MockMathstreamBrowserService extends AbstractMockAppService {
  public override upgradeClient!: UpgradeClient;
  // public upgradeClient: any;

  /******************* required metadata to describe the mock app and its callable hooks ********************/
  public NAME = MOCK_APP_NAMES.MATHSTREAM_AdaptiveSegmentSwapExperiment;
  public DESCRIPTION = 'Test for Version 1 library code in Mathstream';
  public TYPE: MockAppType = 'frontend';
  public LANGUAGE: CodeLanguage = 'ts';
  public SITES = {
    DisplayQuestion: 'DisplayQuestion',
  };
  public TARGETS = {
    TARGET_1: 'AR-VST-0150-6.NS.8-1_SP_008',
    TARGET_2: 'AR-VST-0150-6.NS.8-1_SP_004',
    TARGET_3: 'AR-VST-0150-6.NS.8-1_SP_014',
  };
  public GROUPS = ['schoolId', 'classId', 'instructorId'];
  public CONTEXT = 'mathstream';
  public HOOKNAMES = {
    init: 'init',
    getExperimentalQuestionIfExists: 'GET CONDITION IF EXISTS',
    markExperimentBeginning: 'MARK',
    logExperimentConcluding: 'LOG',
  };
  public DECISION_POINTS = [
    { site: this.SITES.DisplayQuestion, target: this.TARGETS.TARGET_1 },
    { site: this.SITES.DisplayQuestion, target: this.TARGETS.TARGET_2 },
    { site: this.SITES.DisplayQuestion, target: this.TARGETS.TARGET_3 },
  ];

  // this is specific to the mocked component
  private activeExperiments: ActiveExperiment[] = [];

  constructor(public override clientLibraryService: ClientLibraryService, public override eventBus: EventBusService) {
    super(MOCK_APP_NAMES.MATHSTREAM_AdaptiveSegmentSwapExperiment, eventBus, clientLibraryService);
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
          name: this.HOOKNAMES.init,
          description: 'REQUIRED TO RUN FIRST. runs init(), needs userId string as payload.',
        },
        {
          name: this.HOOKNAMES.getExperimentalQuestionIfExists,
          description: 'runs getExperimentalQuestionIfExists(), needs activityId string as payload',
        },
        {
          name: this.HOOKNAMES.markExperimentBeginning,
          description: 'mark experiment point with given activityId payload',
        },
        {
          name: this.HOOKNAMES.logExperimentConcluding,
          description: 'log metric for percent correct for given question',
        },
      ],
      decisionPoints: this.DECISION_POINTS,
      groups: this.GROUPS,
      buttons: [
        {
          hookName: this.HOOKNAMES.init,
          label: 'init (Run before other hooks!)',
        },
        {
          hookName: this.HOOKNAMES.getExperimentalQuestionIfExists,
          label: `Get assignment for: ${this.TARGETS.TARGET_1}`,
          props: {
            activityId: this.TARGETS.TARGET_1,
          },
        },
        {
          hookName: this.HOOKNAMES.getExperimentalQuestionIfExists,
          label: `Get assignment for:  ${this.TARGETS.TARGET_2}`,
          props: {
            activityId: this.TARGETS.TARGET_2,
          },
        },
        {
          hookName: this.HOOKNAMES.getExperimentalQuestionIfExists,
          label: `Get assignment for:  ${this.TARGETS.TARGET_3}`,
          props: {
            activityId: this.TARGETS.TARGET_3,
          },
        },
        {
          hookName: this.HOOKNAMES.getExperimentalQuestionIfExists,
          label: `Get assignment for: no activity id`,
          props: {
            activityId: 'no activity id',
          },
        },
        {
          hookName: this.HOOKNAMES.markExperimentBeginning,
          label: `Mark condition for:  ${this.TARGETS.TARGET_1}`,
          props: {
            activityId: this.TARGETS.TARGET_1,
          },
        },
        {
          hookName: this.HOOKNAMES.markExperimentBeginning,
          label: `Mark condition for:  ${this.TARGETS.TARGET_2}`,
          props: {
            activityId: this.TARGETS.TARGET_2,
          },
        },
        {
          hookName: this.HOOKNAMES.markExperimentBeginning,
          label: `Mark condition for:  ${this.TARGETS.TARGET_3}`,
          props: {
            activityId: this.TARGETS.TARGET_3,
          },
        },
        {
          hookName: this.HOOKNAMES.markExperimentBeginning,
          label: `Mark condition for: no activity id`,
          props: {
            activityId: 'no activity id',
          },
        },
        {
          hookName: this.HOOKNAMES.logExperimentConcluding,
          label: `Log question answered correctly`,
          props: {
            questionAnsweredCorrectly: true,
          },
        },
        {
          hookName: this.HOOKNAMES.logExperimentConcluding,
          label: `Log question answered incorrectly`,
          props: {
            questionAnsweredCorrectly: false,
          },
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

    if (name === this.HOOKNAMES.init && user?.id) {
      this.init(user.id);
    } else if (name === this.HOOKNAMES.getExperimentalQuestionIfExists && hookEvent?.payload?.activityId) {
      this.getExperimentalQuestionIfExists(hookEvent.payload.activityId);
    } else if (name === this.HOOKNAMES.markExperimentBeginning && hookEvent?.payload?.activityId) {
      this.markExperimentBeginning(hookEvent.payload.activityId);
    } else if (
      name === this.HOOKNAMES.logExperimentConcluding &&
      typeof hookEvent?.payload?.questionAnsweredCorrectly === 'boolean'
    ) {
      this.logExperimentConcluding(hookEvent.payload.questionAnsweredCorrectly);
    } else {
      throw new Error(`No hook found for hookName: ${name}`);
    }
  }

  /******************* simulated client app code ****************************************************/

  async init(userId: string) {
    this.upgradeClient = this.constructUpgradeClient(userId);
    const initResponse = await this.upgradeClient.init();
    console.log('upgradeClient', this.upgradeClient);
    console.log({ initResponse });
  }

  async getExperimentalQuestionIfExists(activityId: string): Promise<string> {
    let selectedActivityId = activityId;
    try {
      const experimentAssignment = await this.getExperimentAssignment(activityId);

      console.log('[getExperimentalQuestionIfExists] assignment:', experimentAssignment);
      selectedActivityId = this.determineActivityToUse(experimentAssignment, activityId);
    } catch (err) {
      console.log('upgradeClient error', err);
    }

    console.log('[getExperimentalQuestionIfExists] selectedActivityId:', selectedActivityId);

    return selectedActivityId;
  }

  private determineActivityToUse(
    experimentAssignment: IExperimentAssignment | null,
    originalActivityId: string
  ): string {
    let selectedActivityId = originalActivityId;
    if (!experimentAssignment) return selectedActivityId;
    const conditionCode = experimentAssignment.assignedCondition.conditionCode;

    if (conditionCode === QUESTION_SWAP_EXPERIMENT.CONTROL) {
      selectedActivityId = originalActivityId;
    } else if (conditionCode !== QUESTION_SWAP_EXPERIMENT.CONTROL) {
      selectedActivityId = conditionCode;
    }
    this.addActiveExperimentToCache({
      originalActivityId: originalActivityId,
      selectedActivityId: selectedActivityId,
      conditionCode: conditionCode,
    });
    console.log('Active Experiments', this.activeExperiments);
    return selectedActivityId;
  }

  private addActiveExperimentToCache(activeExperiment: ActiveExperiment): void {
    this.activeExperiments.push(activeExperiment);
  }

  async markExperimentBeginning(activityId: string): Promise<void> {
    try {
      const foundExperiment = this.popActiveExperiment(activityId);
      console.log({ foundExperiment });
      if (!foundExperiment) return;
      const markResponse = await this.upgradeClient.markExperimentPoint(
        QUESTION_SWAP_EXPERIMENT.SITE,
        foundExperiment?.conditionCode,
        foundExperiment?.originalActivityId
      );

      console.log({ markResponse });
    } catch (err) {
      console.log('upgradeClient error', err);
    }
  }

  async logExperimentConcluding(questionAnsweredCorrectly: boolean): Promise<void> {
    try {
      let percentCorrect = 0;
      if (questionAnsweredCorrectly) percentCorrect = 100;
      const logResponse = await this.upgradeClient.log([
        {
          timestamp: new Date().toISOString(),
          metrics: {
            attributes: {
              percentCorrect: percentCorrect,
            },
            groupedMetrics: [] as any[],
          },
        },
      ]);

      console.log({ logResponse });
    } catch (err) {
      console.log('upgradeClient error', err);
    }
  }

  private popActiveExperiment(activityId: string): ActiveExperiment | undefined {
    const foundIndex = this.activeExperiments.findIndex((x) => x.selectedActivityId === activityId);
    if (foundIndex < 0) return undefined;
    const foundExperiment = this.activeExperiments[foundIndex];
    this.activeExperiments.splice(foundIndex, 1);
    return foundExperiment;
  }

  private async getExperimentAssignment(activityId: string): Promise<IExperimentAssignment | null> {
    const upgradeCondition = await this.upgradeClient.getExperimentCondition(
      QUESTION_SWAP_EXPERIMENT.CONTEXT,
      QUESTION_SWAP_EXPERIMENT.SITE,
      activityId
    );
    return upgradeCondition;
  }
}
