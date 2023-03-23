import setGroupMembership from './functions/setGroupMembership';
import { Interfaces } from './identifiers';
import setWorkingGroup from './functions/setWorkingGroup';
import getAllExperimentConditions from './functions/getAllExperimentConditions';
import {
  IFeatureFlag,
  ISingleMetric,
  IGroupMetric,
  ILogInput,
  MARKED_DECISION_POINT_STATUS,
  IExperimentAssignment2,
} from 'upgrade_types';
import getExperimentCondition, { Assignment } from './functions/getExperimentCondition';
import markExperimentPoint from './functions/markExperimentPoint';
import getAllFeatureFlags from './functions/getAllfeatureFlags';
import log from './functions/log';
import setAltUserIds from './functions/setAltUserIds';
import addMetrics from './functions/addMetrics';
import getFeatureFlag from './functions/getFeatureFlag';
import init from './functions/init';
import * as uuid from 'uuid';

export default class UpgradeClient {
  // Endpoints URLs
  private api = {
    init: null as string,
    getAllExperimentConditions: null as string,
    markExperimentPoint: null as string,
    setGroupMemberShip: null as string,
    setWorkingGroup: null as string,
    failedExperimentPoint: null as string,
    getAllFeatureFlag: null as string,
    log: null as string,
    altUserIds: null as string,
    addMetrics: null as string,
  };
  private userId: string;
  private hostUrl: string;
  private context: string;
  // Use token if it is given in constructor
  private token: string;
  private clientSessionId: string;

  private group: Record<string, Array<string>> = null;
  private workingGroup: Record<string, string> = null;
  private experimentConditionData: IExperimentAssignment2[] = null;
  private featureFlags: IFeatureFlag[] = null;

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
      init: `${hostUrl}/api/v4/init`,
      getAllExperimentConditions: `${hostUrl}/api/v4/assign`,
      markExperimentPoint: `${hostUrl}/api/v4/mark`,
      setGroupMemberShip: `${hostUrl}/api/v4/groupmembership`,
      setWorkingGroup: `${hostUrl}/api/v4/workinggroup`,
      failedExperimentPoint: `${hostUrl}/api/v4/failed`,
      getAllFeatureFlag: `${hostUrl}/api/v4/featureflag`,
      log: `${hostUrl}/api/v4/log`,
      altUserIds: `${hostUrl}/api/v4/useraliases`,
      addMetrics: `${hostUrl}/api/v4/metric`,
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

  async init(group?: Record<string, Array<string>>, workingGroup?: Record<string, string>): Promise<Interfaces.IUser> {
    this.validateClient();
    return await init(this.api.init, this.userId, this.token, this.clientSessionId, group, workingGroup);
  }

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

  async getAllExperimentConditions(): Promise<IExperimentAssignment2[]> {
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
    return response;
  }

  async getDecisionPointAssignment(site: string, target?: string): Promise<Assignment> {
    this.validateClient();
    if (this.experimentConditionData == null) {
      await this.getAllExperimentConditions();
    }
    return getExperimentCondition(this.experimentConditionData, site, target);
  }

  async markExperimentPoint(
    site: string,
    condition: string = null,
    status: MARKED_DECISION_POINT_STATUS,
    target?: string
  ): Promise<Interfaces.IMarkExperimentPoint> {
    this.validateClient();
    return await markExperimentPoint(
      this.api.markExperimentPoint,
      this.userId,
      this.token,
      this.clientSessionId,
      site,
      condition,
      status,
      target
    );
  }

  async getAllFeatureFlags(): Promise<IFeatureFlag[]> {
    this.validateClient();
    const response = await getAllFeatureFlags(this.api.getAllFeatureFlag, this.token, this.clientSessionId);
    if (response.length) {
      this.featureFlags = response;
    }
    return response;
  }

  getFeatureFlag(key: string): IFeatureFlag {
    this.validateClient();
    return getFeatureFlag(this.featureFlags, key);
  }

  async log(value: ILogInput[], sendAsAnalytics = false): Promise<Interfaces.ILog[]> {
    this.validateClient();
    return await log(this.api.log, this.userId, this.token, this.clientSessionId, value, sendAsAnalytics);
  }

  async setAltUserIds(altUserIds: string[]): Promise<Interfaces.IExperimentUserAliases[]> {
    this.validateClient();
    return await setAltUserIds(this.api.altUserIds, this.userId, this.token, this.clientSessionId, altUserIds);
  }

  async addMetrics(metrics: (ISingleMetric | IGroupMetric)[]): Promise<Interfaces.IMetric[]> {
    this.validateClient();
    return await addMetrics(this.api.addMetrics, this.token, this.clientSessionId, metrics);
  }
}
