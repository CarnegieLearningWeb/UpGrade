import { UpGradeClientEnums, UpGradeClientInterfaces } from './types';
import { DefaultHttpClient } from './DefaultHttpClient';
import {
  CaliperEnvelope,
  IExperimentAssignmentv5,
  IFeatureFlag,
  IFlagVariation,
  IGroupMetric,
  ILogInput,
  ISingleMetric,
} from '../../../types/src';
import { DataService } from 'DataService';

interface ApiServiceRequestParams {
  url: string;
  requestType: UpGradeClientEnums.REQUEST_TYPES;
  requestBody?: any;
  options?: any;
}
export default class ApiService {
  private context: string;
  private hostUrl: string;
  private userId: string;
  private token: string;
  private apiVersion: string;
  private clientSessionId: string;
  private httpClient: UpGradeClientInterfaces.IHttpClientWrapper;
  private api: UpGradeClientInterfaces.IEndpoints;

  constructor(config: UpGradeClientInterfaces.IConfig, private dataService: DataService) {
    this.context = config.context;
    this.hostUrl = config.hostURL;
    this.token = config.token;
    this.clientSessionId = config.clientSessionId;
    this.httpClient = config.httpClient || new DefaultHttpClient(this.clientSessionId, this.token);
    this.userId = config.userId;
    this.apiVersion = config.apiVersion;
    this.api = {
      init: `${this.hostUrl}/api/${this.apiVersion}/init`,
      getAllExperimentConditions: `${this.hostUrl}/api/${this.apiVersion}/assign`,
      markDecisionPoint: `${this.hostUrl}/api/${this.apiVersion}/mark`,
      setGroupMemberShip: `${this.hostUrl}/api/${this.apiVersion}/groupmembership`,
      setWorkingGroup: `${this.hostUrl}/api/${this.apiVersion}/workinggroup`,
      failedExperimentPoint: `${this.hostUrl}/api/${this.apiVersion}/failed`,
      getAllFeatureFlag: `${this.hostUrl}/api/${this.apiVersion}/featureflag`,
      log: `${this.hostUrl}/api/${this.apiVersion}/log`,
      logCaliper: `${this.hostUrl}/api/${this.apiVersion}/log/caliper`,
      altUserIds: `${this.hostUrl}/api/${this.apiVersion}/useraliases`,
      addMetrics: `${this.hostUrl}/api/${this.apiVersion}/metric`,
    };
  }

  private validateClient() {
    if (!this.hostUrl) {
      throw new Error('Please set application host URL first.');
    }
    if (!this.userId) {
      throw new Error('Please provide valid user id.');
    }
    if (!this.context) {
      throw new Error('Please provide valid context.');
    }
    if (!this.httpClient) {
      throw new Error('HttpClient is not defined.');
    }
  }

  private async sendRequest<RequestBodyType>(requestParams: ApiServiceRequestParams): Promise<any> {
    this.validateClient();

    if (requestParams.requestType === UpGradeClientEnums.REQUEST_TYPES.GET) {
      const response = await this.httpClient.get(requestParams.url, requestParams.options);
      return response;
    }

    if (requestParams.requestType === UpGradeClientEnums.REQUEST_TYPES.POST) {
      const response: ResponseType = await this.httpClient.post<RequestBodyType>(
        requestParams.url,
        requestParams.requestBody,
        requestParams.options
      );
      return response;
    }

    if (requestParams.requestType === UpGradeClientEnums.REQUEST_TYPES.PATCH) {
      const response: ResponseType = await this.httpClient.patch<RequestBodyType>(
        requestParams.url,
        requestParams.requestBody,
        requestParams.options
      );
      return response;
    }
  }

  public async init(
    group?: Record<string, Array<string>>,
    workingGroup?: Record<string, string>
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    let requestBody: UpGradeClientInterfaces.IExperimentUser = {
      id: this.userId,
    };

    if (group) {
      requestBody = {
        ...requestBody,
        group,
      };
    }

    if (workingGroup) {
      requestBody = {
        ...requestBody,
        workingGroup,
      };
    }

    return await this.sendRequest<UpGradeClientInterfaces.IExperimentUser>({
      url: this.api.init,
      requestType: UpGradeClientEnums.REQUEST_TYPES.POST,
      requestBody,
    });
  }

  public async setGroupMembership(
    group: UpGradeClientInterfaces.IExperimentUserGroup
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    const requestBody: UpGradeClientInterfaces.ISetGroupMembershipRequestBody = {
      id: this.userId,
      group,
    };

    return await this.sendRequest<UpGradeClientInterfaces.IExperimentUser>({
      url: this.api.setGroupMemberShip,
      requestType: UpGradeClientEnums.REQUEST_TYPES.PATCH,
      requestBody,
    });
  }

  public async setWorkingGroup(
    workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    const requestBody: UpGradeClientInterfaces.ISetWorkingGroupRequestBody = {
      id: this.userId,
      workingGroup,
    };

    return await this.sendRequest<UpGradeClientInterfaces.IExperimentUser>({
      url: this.api.setWorkingGroup,
      requestType: UpGradeClientEnums.REQUEST_TYPES.PATCH,
      requestBody,
    });
  }

  public async setAltUserIds(
    altUserIds: UpGradeClientInterfaces.IExperimentUserAliases
  ): Promise<UpGradeClientInterfaces.IExperimentUserAliases> {
    const requestBody: UpGradeClientInterfaces.ISetAltIdsRequestBody = {
      userId: this.userId,
      aliases: altUserIds,
    };

    return await this.sendRequest<UpGradeClientInterfaces.IExperimentUser>({
      url: this.api.altUserIds,
      requestType: UpGradeClientEnums.REQUEST_TYPES.PATCH,
      requestBody,
    });
  }

  public async getAllExperimentConditions(): Promise<IExperimentAssignmentv5[]> {
    const requestBody: UpGradeClientInterfaces.IGetAllExperimentConditionsRequestBody = {
      userId: this.userId,
      context: this.context,
    };

    const experimentConditionResponse = await this.sendRequest({
      url: this.api.getAllExperimentConditions,
      requestType: UpGradeClientEnums.REQUEST_TYPES.POST,
      requestBody,
    });

    return experimentConditionResponse.data.map((data: IExperimentAssignmentv5) => {
      return data;
    });
  }

  public async markDecisionPoint({
    site,
    target,
    condition,
    status,
    uniquifier,
    clientError,
  }: UpGradeClientInterfaces.MarkDecisionPointParams): Promise<UpGradeClientInterfaces.IMarkDecisionPoint> {
    const assignment = this.dataService.findExperimentAssignmentBySiteAndTarget(site, target);

    if (!assignment) {
      throw new Error('No assignment found');
    }

    this.dataService.rotateAssignmentList(assignment);

    const data = { ...assignment, assignedCondition: { ...assignment.assignedCondition[0], conditionCode: condition } };

    let requestBody: UpGradeClientInterfaces.IMarkDecisionPointRequestBody = {
      userId: this.userId,
      status,
      data,
    };

    if (uniquifier) {
      requestBody = {
        ...requestBody,
        uniquifier,
      };
    }
    if (clientError) {
      requestBody = {
        ...requestBody,
        clientError,
      };
    }

    // send request
    return await this.sendRequest<UpGradeClientInterfaces.IMarkDecisionPoint>({
      url: this.api.markDecisionPoint,
      requestType: UpGradeClientEnums.REQUEST_TYPES.POST,
      requestBody,
    });
  }

  public async log(logData: ILogInput[], sendAsAnalytics = false): Promise<UpGradeClientInterfaces.ILog[]> {
    const requestBody: UpGradeClientInterfaces.ILogRequestBody = {
      userId: this.userId,
      value: logData,
    };

    return await this.sendRequest<UpGradeClientInterfaces.ILog[]>({
      url: this.api.log,
      requestType: UpGradeClientEnums.REQUEST_TYPES.POST,
      requestBody,
    });
  }

  public async logCaliper(logData: CaliperEnvelope, sendAsAnalytics = false): Promise<UpGradeClientInterfaces.ILog[]> {
    const requestBody: CaliperEnvelope = logData;

    return await this.sendRequest<UpGradeClientInterfaces.ILog[]>({
      url: this.api.logCaliper,
      requestType: UpGradeClientEnums.REQUEST_TYPES.POST,
      requestBody,
    });
  }

  public async addMetrics(metrics: (ISingleMetric | IGroupMetric)[]): Promise<UpGradeClientInterfaces.IMetric[]> {
    const requestBody = { metricUnit: metrics };

    return await this.sendRequest<UpGradeClientInterfaces.IMetric[]>({
      url: this.api.addMetrics,
      requestType: UpGradeClientEnums.REQUEST_TYPES.POST,
      requestBody,
    });
  }

  public async getAllFeatureFlags(): Promise<IFeatureFlag[]> {
    const response = await this.sendRequest({
      url: this.api.getAllFeatureFlag,
      requestType: UpGradeClientEnums.REQUEST_TYPES.GET,
    });

    return response.data.map((flag: IFeatureFlag) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { variations, ...rest } = flag;
      const updatedVariations = variations.map((variation: IFlagVariation) => {
        const { ...restVariation } = variation;
        return restVariation;
      });
      return {
        ...rest,
        variations: updatedVariations,
      };
    });
  }
}
