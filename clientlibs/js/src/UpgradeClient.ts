import setGroupMembership from './functions/setGroupMembership';
import { Interfaces } from './identifiers';
import setWorkingGroup from './functions/setWorkingGroup';
import getAllExperimentConditions from './functions/getAllExperimentConditions';
import {
  IFeatureFlag,
  ISingleMetric,
  IGroupMetric,
  ILogInput,
  CaliperEnvelope,
  IExperimentAssignmentv5,
  MARKED_DECISION_POINT_STATUS,
} from 'upgrade_types';
import getDecisionPointAssignment, { Assignment } from './functions/getExperimentCondition';
import getAllFeatureFlags from './functions/getAllfeatureFlags';
import log from './functions/log';
import logCaliper from './functions/logCaliper';
import setAltUserIds from './functions/setAltUserIds';
import addMetrics from './functions/addMetrics';
import getFeatureFlag from './functions/getFeatureFlag';
import init from './functions/init';
import * as uuid from 'uuid';
import markExperimentPoint from './functions/markExperimentPoint';

/**
 * UpGradeClient is the main class for interacting with the UpGrade API.
 * 
 * @example
* ```typescript
* import UpgradeClient from 'upgrade_client_lib/dist/browser';
* ```
*
* ```typescript
* import UpgradeClient from 'upgrade_client_lib/dist/node';
* ```
*
* General UpGrade types can also be accessed as named exports:
* ```typescript
* import UpgradeClient, { IExperimentAssignment } from 'upgrade_client_lib/dist/browser';
* ```
*
* SDK-Specific types can be accessed also:
* ```typescript
* import { Interfaces } from 'upgrade_client_lib/dist/clientlibs/js/src/identifiers';
* 
* const initResponse: Interfaces.IUser = await upgradeClient.init();
* ```
*/

export default class UpgradeClient {
  // Endpoints URLs
  private api = {
    init: '',
    getAllExperimentConditions: '',
    markExperimentPoint: '',
    setGroupMemberShip: '',
    setWorkingGroup: '',
    failedExperimentPoint: '',
    getAllFeatureFlag: '',
    log: '',
    logCaliper: '',
    altUserIds: '',
    addMetrics: '',
  };
  private userId: string;
  private hostUrl: string;
  private context: string;
  // Use token if it is given in constructor
  private token: string;
  private clientSessionId: string;

  private group: Record<string, Array<string>> = null;
  private workingGroup: Record<string, string> = null;
  private experimentConditionData: IExperimentAssignmentv5[] = null;
  private featureFlags: IFeatureFlag[] = null;

/**
 * When constructing UpgradeClient, the user id, api host url, and "context" identifier are required.
 * These will be attached to various API calls for this instance of the client.
 * 
 * @example
 * 
 * ```typescript
 * // required
 * const hostUrl: "htts://my-hosted-upgrade-api.com";
 * const userId: "abc123";
 * const context: "my-app-context-name";
 * 
 * // not required, each is also optional
 * const options: {
 *   token: "someToken";
 *   clientSessionId: "someSessionId";
 * }
 * 
 * const upgradeClient: UpgradeClient[] = new UpgradeClient(hostURL, userId, context);
 * const upgradeClient: UpgradeClient[] = new UpgradeClient(hostURL, userId, context, options);
 * ```
 */
  constructor(
    userId: string,
    hostUrl: string,
    context: string,
    options?: { token?: string; clientSessionId?: string }
  ) {
    this.userId = userId;
    this.hostUrl = hostUrl;
    this.context = context;
    this.token = options?.token;
    this.clientSessionId = options?.clientSessionId || uuid.v4();
    this.api = {
      init: `${hostUrl}/api/v5/init`,
      getAllExperimentConditions: `${hostUrl}/api/v5/assign`,
      markExperimentPoint: `${hostUrl}/api/v5/mark`,
      setGroupMemberShip: `${hostUrl}/api/v5/groupmembership`,
      setWorkingGroup: `${hostUrl}/api/v5/workinggroup`,
      failedExperimentPoint: `${hostUrl}/api/v5/failed`,
      getAllFeatureFlag: `${hostUrl}/api/v5/featureflag`,
      log: `${hostUrl}/api/v5/log`,
      logCaliper: `${hostUrl}/api/v5/logCaliper`,
      altUserIds: `${hostUrl}/api/v5/useraliases`,
      addMetrics: `${hostUrl}/api/v5/metric`,
    };
  }

  private validateClient() {
    if (!this.hostUrl) {
      throw new Error('Please set application host URL first.');
    }
    if (!this.userId) {
      throw new Error('Please provide valid user id.');
    }
  }

/**
 * This will initialize user and metadata for the user. It will return the user object with id, group, and working group.
 * NOTE: A user must be initialized at least once before calling any other methods.
 * Else, you will see "Experiment user not defined" errors when other SDK methods are called.
 * 
 * @example
 * ```typescript
 * const group: Record<string, Array<string>> = {
 *   classId: ['class1', 'class2'],
 *   districtId: ['district1', 'district2'],
 * }
 * 
 * const workingGroup: Record<string, string> = {
 *  classId: 'class1',
 *  districtId: 'district2',
 * }
 * 
 * const initResponse: Interfaces.IUser[] = await upgradeClient.init();
 * const initResponse: Interfaces.IUser[] = await upgradeClient.init(group);
 * const initResponse: Interfaces.IUser[] = await upgradeClient.init(group, workingGroup);
 * 
 * ```
 */
  async init(group?: Record<string, Array<string>>, workingGroup?: Record<string, string>): Promise<Interfaces.IUser> {
    this.validateClient();
    return await init(this.api.init, this.userId, this.token, this.clientSessionId, group, workingGroup);
  }

/**
 * Will set the group membership(s) for the user and return the user object with updated working group.
 * 
 * @example
 * ```typescript
 * const group: Record<string, Array<string>> = {
 *   classId: ['class1', 'class2'],
 *   districtId: ['district1', 'district2'],
 * }
 * 
 * const groupMembershipResponse: Interfaces.IUser[] = await upgradeClient.setGroupMembership(group);
 * ```
 */
  async setGroupMembership(group: Record<string, Array<string>>): Promise<Interfaces.IUser> {
    this.validateClient();
    let response: Interfaces.IUser = await setGroupMembership(
      this.api.setGroupMemberShip,
      this.userId,
      this.token,
      this.clientSessionId,
      group
    );
    if (response.id) {
      // If it does not throw error from setGroupMembership
      this.group = group;
      response = {
        ...response,
        workingGroup: this.workingGroup,
      };
    }
    return response;
  }

/**
 * Will set the working group(s) for the user and return the user object with updated working group.
 * 
 * @example
 * ```typescript
 * const workingGroup: Record<string, string> = {
 *  classId: 'class1',
 *  districtId: 'district2',
 * }
 * 
 * const workingGroupResponse: Interfaces.IUser[] = await upgradeClient.setWorkingGroup(workingGroup);
 * ```
 */
  async setWorkingGroup(workingGroup: Record<string, string>): Promise<Interfaces.IUser> {
    this.validateClient();
    let response: Interfaces.IUser = await setWorkingGroup(
      this.api.setWorkingGroup,
      this.userId,
      this.token,
      this.clientSessionId,
      workingGroup
    );
    if (response.id) {
      // If it does not throw error from setWorkingGroup
      this.workingGroup = workingGroup;
      response = {
        ...response,
        group: this.group,
      };
    }
    return response;
  }

  /**
 * This will return all the assignment for the given context.
 * The return object contains site, target, experimentType, assignedCondition array and assignedFactor array(optional)
 * Here assignedCondition and assignedFactors(For Factorial-experiment) are arrays
 *    They will return a stack of condition user will be assigned in that order
 * For With-in subjects these stacks will be contain all conditions according to the chosen `Condition-Order`
 * For Between subjects experiment both stack will return array containing single condition.
 * 
 * @example
 * ```typescript
 * const userId = User1
 * const context = mathia
 * 
 * const getAllResponse: IExperimentAssignmentv5[] = await upgradeClient.getAllExperimentConditions();
 * ```
 */
  async getAllExperimentConditions(): Promise<IExperimentAssignmentv5[]> {
    this.validateClient();
    const response = await getAllExperimentConditions(
      this.api.getAllExperimentConditions,
      this.userId,
      this.token,
      this.clientSessionId,
      this.context
    );
    if (Array.isArray(response)) {
      this.experimentConditionData = response;
    }

    // returns the first element of the queue
    return response;
  }

/**
 * Given a site and optional target, return the condition assignment at this decision point
 * NOTE: If getAllExperimentConditions() has not been called, this will call it first.
 * NOTE ALSO: If getAllExperimentConditions() has been called, this will return the cached result and not make a network call.
 *  
 * @example
 * ```typescript
 * const allExperimentConditionsResponse: IExperimentAssignmentv4[] = await upgradeClient.getAllExperimentConditions(workingGroup);
 * ```
 */

  async getDecisionPointAssignment(site: string, target?: string): Promise<Assignment> {
    this.validateClient();
    if (this.experimentConditionData == null) {
      await this.getAllExperimentConditions();
    }
    const markObject = {
      url: this.api.markExperimentPoint,
      userId: this.userId,
      token: this.token,
      clientSessionId: this.clientSessionId,
      getAllExperimentData: this.experimentConditionData,
    };
    return getDecisionPointAssignment(this.experimentConditionData, site, target, markObject);
  }

  /**
   * Will record ("mark") that a user has "seen" a decision point.
   * 
   * Marking the decision point will record the user's condition assignment and the time of the decision point, regardless of whether the user is enrolled in an experiment.
   * 
   * `status` signifies a client application's note on what it did in the code with condition assignment that Upgrade provided.
   *  Status can be one of the following:
   * 
   * ```ts
   * export enum MARKED_DECISION_POINT_STATUS {
   *   CONDITION_APPLIED = 'condition applied',
   *   CONDITION_FAILED_TO_APPLY = 'condition not applied',
   *   NO_CONDITION_ASSIGNED = 'no condition assigned',
   * }
   * ```
   * 
   * The client can also send along an additional `clientError` string to log context as to why a condition was not applied.
   * 
   * @example
   * ```ts
   * import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
   * 
   * const site = 'dashboard';
   * const condition = 'variant_x'; // send null if no condition / no experiment is running / error
   * const status: MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
   * const target = 'experimental button'; // optional
   * const clientError = 'variant not recognized'; //optional
   * 
   * const allExperimentConditionsResponse: IExperimentAssignmentv4[] = await upgradeClient.markExperimentPoint(site, condition, MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED, target, clientError);
   * ```
   */

  async markExperimentPoint(
    site: string,
    target: string,
    condition: string = null,
    status: MARKED_DECISION_POINT_STATUS,
    clientError?: string
  ): Promise<Interfaces.IMarkExperimentPoint> {
    this.validateClient();
    if (this.experimentConditionData == null) {
      await this.getAllExperimentConditions();
    }
    // rotation
    const stack = this.experimentConditionData.find(data => data.site === site && data.target === target)
    stack.assignedCondition.push(stack.assignedCondition.shift());
    if (stack.assignedFactor) {
      stack.assignedFactor.push(stack.assignedFactor.shift());
    }
    return await markExperimentPoint(
      this.api.markExperimentPoint,
      this.userId,
      this.token,
      this.clientSessionId,
      site,
      target,
      condition,
      status,
      this.experimentConditionData,
      clientError
    );
  }

  /**
   * This feature is available but not recommended for use as it is not fully regression tested in recent releases.
   * @ignore
   */

  async getAllFeatureFlags(): Promise<IFeatureFlag[]> {
    this.validateClient();
    const response = await getAllFeatureFlags(this.api.getAllFeatureFlag, this.token, this.clientSessionId);
    if (response.length) {
      this.featureFlags = response;
    }
    return response;
  }

  /**
   * This feature is available but not recommended for use as it is not fully regression tested in recent releases.
   * @ignore
   */

  getFeatureFlag(key: string): IFeatureFlag {
    this.validateClient();
    return getFeatureFlag(this.featureFlags, key);
  }

  /**
   * Will report user outcome metrics to Upgrade.
   * Please see https://upgrade-platform.gitbook.io/docs/developer-guide/reference/metrics for more information.
   * 
   * @example
   * ```ts
   * const metrics: IMetricInput[] = [
   *     {
   *         "metric": "totalTimeSeconds",
   *         "datatype": "continuous"
   *     },
   *     {
   *         "metric": "completedAll",
   *         "datatype": "categorical",
   *         "allowedValues": [ "COMPLETE", "INCOMPLETE" ]
   *     },
   *     {
   *         "groupClass": "quizzes",
   *         "allowedKeys":
   *             [
   *                 "quiz1",
   *                 "quiz2",
   *                 "quiz3"
   *             ],
   *         "attributes": 
   *             [
   *                 {
   *                     "metric": "quizTimeSeconds",
   *                     "datatype": "continuous"
   *                 },
   *                 {
   *                     "metric": "score",
   *                     "datatype": "continuous"
   *                 },
   *                 {
   *                     "metric": "passStatus",
   *                     "datatype": "categorical",
   *                     "allowedValues": [ "PASS", "FAIL" ]
   *                 }
   *             ]
   *      },
   *      {
   *          "groupClass": "polls",
   *          "allowedKeys":
   *              [
   *                  "poll1",
   *                  "poll2"
   *              ],
   *          "attributes": 
   *              [
   *                  {
   *                      "metric": "pollTimeSeconds",
   *                      "datatype": "continuous"
   *                  },
   *                  {
   *                      "metric": "rank",
   *                      "datatype": "categorical",
   *                      "allowedValues": [ "UNHAPPY", "NEUTRAL", "HAPPY" ]
   *                  }
   *              ]
   *        }
   *   ];
   * 
   * const logResponse: ILog[] = await upgradeClient.metrics(metrics);
   * ```
   */
  async log(value: ILogInput[], sendAsAnalytics = false): Promise<Interfaces.ILog[]> {
    this.validateClient();
    return await log(this.api.log, this.userId, this.token, this.clientSessionId, value, sendAsAnalytics);
  }

/**
 * Will report Caliper user outcome metrics to Upgrade, same as log() but with Caliper envelope.
 * 
 * @example
 * ```ts
 * const logRequest: CaliperEnvelope = {
      sensor: 'test',
      sendTime: 'test',
      dataVersion: 'test',
      data: [],
    };
 *
 *
 *  const logCaliperResponse: ILog[] = await upgradeClient.logCaliper(logRequest);
 * 
 * ```
 */
  async logCaliper(value: CaliperEnvelope, sendAsAnalytics = false): Promise<Interfaces.ILog[]> {
    this.validateClient();
    return await logCaliper(this.api.logCaliper, this.userId, this.token, this.clientSessionId, value, sendAsAnalytics);
  }

  /**
   * Will set an array of alternate user ids for the user.
   * 
   * @example
   * ```ts
   * const aliases: string[] = ['alias1', 'alias2'];
   * 
   * const setAltUserIdsResponse: IExperimentUserAliases[] = await upgradeClient.setAltUserIds(aliases);
   * ```
   */
  async setAltUserIds(altUserIds: string[]): Promise<Interfaces.IExperimentUserAliases[]> {
    this.validateClient();
    return await setAltUserIds(this.api.altUserIds, this.userId, this.token, this.clientSessionId, altUserIds);
  }

  /**
   * This feature is available but not recommended for use as it is not fully regression tested in recent releases.
   * @ignore
   */
  async addMetrics(metrics: (ISingleMetric | IGroupMetric)[]): Promise<Interfaces.IMetric[]> {
    this.validateClient();
    return await addMetrics(this.api.addMetrics, this.token, this.clientSessionId, metrics);
  }
}
