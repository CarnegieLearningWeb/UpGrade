import { UpGradeClientEnums, UpGradeClientInterfaces, UpGradeClientRequests } from '../types';
import { DefaultHttpClient } from '../DefaultHttpClient/DefaultHttpClient';
import {
  CaliperEnvelope,
  IExperimentAssignmentv5,
  IFeatureFlag,
  IFlagVariation,
  IGroupMetric,
  ILogInput,
  ISingleMetric,
} from 'upgrade_types';
import { DataService } from 'DataService/DataService';
import { IApiServiceRequestParams, IEndpoints } from './ApiService.types';
import { IMarkDecisionPointParams } from 'UpGradeClient/UpGradeClient.types';
import * as uuid from 'uuid';

// this variable is used by webpack to replace the value of USE_CUSTOM_HTTP_CLIENT with true or false to create two different builds
declare const USE_CUSTOM_HTTP_CLIENT: boolean;
declare const IS_BROWSER: boolean;

export default class ApiService {
  private context: string;
  private hostUrl: string;
  private userId: string;
  private token: string;
  private apiVersion: string;
  private clientSessionId: string;
  private httpClient: UpGradeClientInterfaces.IHttpClientWrapper;
  private api: IEndpoints;

  constructor(config: UpGradeClientInterfaces.IConfig, private dataService: DataService) {
    this.context = config.context;
    this.hostUrl = config.hostURL;
    this.token = config.token;
    this.clientSessionId = config.clientSessionId;
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
    this.httpClient = this.setHttpClient(config.httpClient);
  }

  private setHttpClient(httpClient: UpGradeClientInterfaces.IHttpClientWrapper) {
    console.log({ USE_CUSTOM_HTTP_CLIENT });
    if (USE_CUSTOM_HTTP_CLIENT) {
      if (httpClient) {
        return httpClient;
      } else {
        throw new Error('Please provide valid httpClient.');
      }
    } else {
      return new DefaultHttpClient();
    }
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

  private createOptions(url: string): UpGradeClientInterfaces.IHttpClientWrapperRequestConfig {
    const options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Session-Id': this.clientSessionId || uuid.v4(), // set this here? Do we need to require a clientSessionId?
        'Client-source': IS_BROWSER ? 'browser' : 'node',
        URL: url,
      },
    };

    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // layer in any custom headers supplied by the user
    if (this.httpClient.config?.headers) {
      options.headers = {
        ...options.headers,
        ...this.httpClient.config?.headers,
      };
    }

    console.log('createOptions', options);

    return options;
  }

  private async sendRequest<RequestBodyType>({ path, method, body }: IApiServiceRequestParams): Promise<any> {
    this.validateClient();

    const options = this.createOptions(path);

    if (method === UpGradeClientEnums.REQUEST_METHOD.GET) {
      return await this.httpClient.doGet(path, options);
    }

    if (method === UpGradeClientEnums.REQUEST_METHOD.POST) {
      return await this.httpClient.doPost<RequestBodyType>(path, body, options);
    }

    if (method === UpGradeClientEnums.REQUEST_METHOD.PATCH) {
      return await this.httpClient.doPatch<RequestBodyType>(path, body, options);
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
      path: this.api.init,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public async setGroupMembership(
    group: UpGradeClientInterfaces.IExperimentUserGroup
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    const requestBody: UpGradeClientRequests.ISetGroupMembershipRequestBody = {
      id: this.userId,
      group,
    };

    return await this.sendRequest<UpGradeClientInterfaces.IExperimentUser>({
      path: this.api.setGroupMemberShip,
      method: UpGradeClientEnums.REQUEST_METHOD.PATCH,
      body: requestBody,
    });
  }

  public async setWorkingGroup(
    workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    const requestBody: UpGradeClientRequests.ISetWorkingGroupRequestBody = {
      id: this.userId,
      workingGroup,
    };

    return await this.sendRequest<UpGradeClientInterfaces.IExperimentUser>({
      path: this.api.setWorkingGroup,
      method: UpGradeClientEnums.REQUEST_METHOD.PATCH,
      body: requestBody,
    });
  }

  public async setAltUserIds(
    altUserIds: UpGradeClientInterfaces.IExperimentUserAliases
  ): Promise<UpGradeClientInterfaces.IExperimentUserAliases> {
    const requestBody: UpGradeClientRequests.ISetAltIdsRequestBody = {
      userId: this.userId,
      aliases: altUserIds,
    };

    return await this.sendRequest<UpGradeClientInterfaces.IExperimentUser>({
      path: this.api.altUserIds,
      method: UpGradeClientEnums.REQUEST_METHOD.PATCH,
      body: requestBody,
    });
  }

  public async getAllExperimentConditions(): Promise<IExperimentAssignmentv5[]> {
    const requestBody: UpGradeClientRequests.IGetAllExperimentConditionsRequestBody = {
      userId: this.userId,
      context: this.context,
    };

    return await this.sendRequest<IExperimentAssignmentv5[]>({
      path: this.api.getAllExperimentConditions,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public async markDecisionPoint({
    site,
    target,
    condition,
    status,
    uniquifier,
    clientError,
  }: IMarkDecisionPointParams): Promise<UpGradeClientInterfaces.IMarkDecisionPoint> {
    const assignment = this.dataService.findExperimentAssignmentBySiteAndTarget(site, target);

    if (!assignment) {
      throw new Error('No assignment found');
    }

    this.dataService.rotateAssignmentList(assignment);

    const data = { ...assignment, assignedCondition: { ...assignment.assignedCondition[0], conditionCode: condition } };

    let requestBody: UpGradeClientRequests.IMarkDecisionPointRequestBody = {
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
      path: this.api.markDecisionPoint,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public async log(logData: ILogInput[]): Promise<UpGradeClientInterfaces.ILog[]> {
    const requestBody: UpGradeClientRequests.ILogRequestBody = {
      userId: this.userId,
      value: logData,
    };

    return await this.sendRequest<UpGradeClientInterfaces.ILog[]>({
      path: this.api.log,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public async logCaliper(logData: CaliperEnvelope): Promise<UpGradeClientInterfaces.ILog[]> {
    const requestBody: CaliperEnvelope = logData;

    return await this.sendRequest<UpGradeClientInterfaces.ILog[]>({
      path: this.api.logCaliper,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public async addMetrics(metrics: (ISingleMetric | IGroupMetric)[]): Promise<UpGradeClientInterfaces.IMetric[]> {
    const requestBody = { metricUnit: metrics };

    return await this.sendRequest<UpGradeClientInterfaces.IMetric[]>({
      path: this.api.addMetrics,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public async getAllFeatureFlags(): Promise<IFeatureFlag[]> {
    const response = await this.sendRequest({
      path: this.api.getAllFeatureFlag,
      method: UpGradeClientEnums.REQUEST_METHOD.GET,
    });

    return response.map((flag: IFeatureFlag) => {
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
