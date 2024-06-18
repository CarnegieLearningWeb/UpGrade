import { UpGradeClientEnums, UpGradeClientInterfaces, UpGradeClientRequests } from '../types';
import { DefaultHttpClient } from '../DefaultHttpClient/DefaultHttpClient';
import { CaliperEnvelope, IExperimentAssignmentv5, ILogInput, IUserAliases, ILogRequestBody } from 'upgrade_types';
import { DataService } from 'DataService/DataService';
import { IApiServiceRequestParams, IEndpoints } from './ApiService.types';
import { IMarkDecisionPointParams } from 'UpGradeClient/UpGradeClient.types';

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
      getAllFeatureFlag: `${this.hostUrl}/api/${this.apiVersion}/featureflag`,
      log: `${this.hostUrl}/api/${this.apiVersion}/log`,
      logCaliper: `${this.hostUrl}/api/${this.apiVersion}/log/caliper`,
      altUserIds: `${this.hostUrl}/api/${this.apiVersion}/useraliases`,
    };
    this.httpClient = this.setHttpClient(config.httpClient);
  }

  private setHttpClient(httpClient: UpGradeClientInterfaces.IHttpClientWrapper) {
    if (USE_CUSTOM_HTTP_CLIENT && !httpClient) {
      throw new Error(
        'Please provide valid httpClient, or use the default (non-"lite") version of the library to our default httpClient.'
      );
    }

    if (!USE_CUSTOM_HTTP_CLIENT && httpClient) {
      throw new Error('Please import "lite" version of the to use custom httpClient.');
    }

    if (USE_CUSTOM_HTTP_CLIENT && httpClient) {
      return httpClient;
    }

    if (!USE_CUSTOM_HTTP_CLIENT && !httpClient) {
      return new DefaultHttpClient();
    }
  }

  private validateClient() {
    if (!USE_CUSTOM_HTTP_CLIENT && !this.hostUrl) {
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
        'Session-Id': this.clientSessionId,
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

    options.withCredentials = Boolean(this.httpClient.config?.withCredentials);

    return options;
  }

  private sendRequest<ResponseType, RequestBodyType>({
    path,
    method,
    body,
  }: IApiServiceRequestParams): Promise<ResponseType> {
    this.validateClient();

    const options = this.createOptions(path);

    if (method === UpGradeClientEnums.REQUEST_METHOD.GET) {
      return this.httpClient.doGet<ResponseType>(path, options);
    }

    if (method === UpGradeClientEnums.REQUEST_METHOD.POST) {
      return this.httpClient.doPost<ResponseType, RequestBodyType>(path, body, options);
    }

    if (method === UpGradeClientEnums.REQUEST_METHOD.PATCH) {
      return this.httpClient.doPatch<ResponseType, RequestBodyType>(path, body, options);
    }
  }

  public init(
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

    return this.sendRequest<UpGradeClientInterfaces.IExperimentUser, UpGradeClientInterfaces.IExperimentUser>({
      path: this.api.init,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public setGroupMembership(
    group: UpGradeClientInterfaces.IExperimentUserGroup
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    const requestBody: UpGradeClientRequests.ISetGroupMembershipRequestBody = {
      id: this.userId,
      group,
    };

    return this.sendRequest<UpGradeClientInterfaces.IExperimentUser, UpGradeClientInterfaces.IExperimentUser>({
      path: this.api.setGroupMemberShip,
      method: UpGradeClientEnums.REQUEST_METHOD.PATCH,
      body: requestBody,
    });
  }

  public setWorkingGroup(
    workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    const requestBody: UpGradeClientRequests.ISetWorkingGroupRequestBody = {
      id: this.userId,
      workingGroup,
    };

    return this.sendRequest<UpGradeClientRequests.ISetWorkingGroupRequestBody, UpGradeClientInterfaces.IExperimentUser>(
      {
        path: this.api.setWorkingGroup,
        method: UpGradeClientEnums.REQUEST_METHOD.PATCH,
        body: requestBody,
      }
    );
  }

  public setAltUserIds(altUserIds: UpGradeClientInterfaces.IExperimentUserAliases): Promise<IUserAliases> {
    const requestBody: UpGradeClientRequests.ISetAltIdsRequestBody = {
      userId: this.userId,
      aliases: altUserIds,
    };

    return this.sendRequest<IUserAliases, UpGradeClientRequests.ISetAltIdsRequestBody>({
      path: this.api.altUserIds,
      method: UpGradeClientEnums.REQUEST_METHOD.PATCH,
      body: requestBody,
    });
  }

  public getAllExperimentConditions(): Promise<IExperimentAssignmentv5[]> {
    const requestBody: UpGradeClientRequests.IGetAllExperimentConditionsRequestBody = {
      userId: this.userId,
      context: this.context,
    };

    return this.sendRequest<IExperimentAssignmentv5[], UpGradeClientRequests.IGetAllExperimentConditionsRequestBody>({
      path: this.api.getAllExperimentConditions,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public markDecisionPoint({
    site,
    target,
    condition,
    status,
    uniquifier,
    clientError,
  }: IMarkDecisionPointParams): Promise<UpGradeClientInterfaces.IMarkDecisionPoint> {
    const assignment = this.dataService.findExperimentAssignmentBySiteAndTarget(site, target);

    this.dataService.rotateAssignmentList(assignment);

    const data = {
      ...assignment,
      assignedCondition: { ...assignment.assignedCondition[0], conditionCode: condition },
    };

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
    return this.sendRequest<
      UpGradeClientInterfaces.IMarkDecisionPoint,
      UpGradeClientRequests.IMarkDecisionPointRequestBody
    >({
      path: this.api.markDecisionPoint,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public log(logData: ILogInput[]): Promise<UpGradeClientInterfaces.ILogResponse[]> {
    const requestBody: ILogRequestBody = {
      userId: this.userId,
      value: logData,
    };

    return this.sendRequest<UpGradeClientInterfaces.ILogResponse[], UpGradeClientInterfaces.ILog[]>({
      path: this.api.log,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public logCaliper(logData: CaliperEnvelope): Promise<UpGradeClientInterfaces.ILogResponse[]> {
    const requestBody: CaliperEnvelope = logData;

    return this.sendRequest<UpGradeClientInterfaces.ILogResponse[], UpGradeClientInterfaces.ILog[]>({
      path: this.api.logCaliper,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });
  }

  public async getAllFeatureFlags(): Promise<string[]> {
    const requestBody: UpGradeClientRequests.IGetAllFeatureFlagsRequestBody = {
      userId: this.userId,
      context: this.context,
    };

    const response = await this.sendRequest<string[], never>({
      path: this.api.getAllFeatureFlag,
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      body: requestBody,
    });

    return response;
  }
}
