import { UpGradeClientEnums } from 'types';
import { UpGradeClientInterfaces } from './types/Interfaces';
import { DefaultHttpClient } from 'DefaultHttpClient';

export default class ApiService {
  private context: string;
  private hostUrl: string;
  private userId: string;
  private token: string;
  private apiVersion: string;
  private clientSessionId: string;
  private httpClient: UpGradeClientInterfaces.IHttpClientWrapper;
  private api: UpGradeClientInterfaces.IEndpoints;

  constructor(config: UpGradeClientInterfaces.IConfig) {
    console.log(config);

    this.hostUrl = config.hostURL;
    this.token = config.token;
    this.clientSessionId = config.clientSessionId;
    this.httpClient = config.httpClient || new DefaultHttpClient();
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
      logCaliper: `${this.hostUrl}/api/${this.apiVersion}/logCaliper`,
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

  public async sendRequest<RequestBodyType>(
    url: string,
    requestType: UpGradeClientEnums.REQUEST_TYPES,
    requestBody: RequestBodyType,
    options?: UpGradeClientInterfaces.IHttpClientWrapperRequestOptions
  ): Promise<any> {
    this.validateClient();
    if (requestType === UpGradeClientEnums.REQUEST_TYPES.GET) {
      const response = await this.httpClient.get(url, options);
      return response;
    }

    if (requestType === UpGradeClientEnums.REQUEST_TYPES.POST) {
      const response: ResponseType = await this.httpClient.post<RequestBodyType>(url, requestBody, options);
      return response;
    }

    if (requestType === UpGradeClientEnums.REQUEST_TYPES.PATCH) {
      const response: ResponseType = await this.httpClient.patch<RequestBodyType>(url, requestBody, options);
      return response;
    }
  }

  public async init(
    group?: Record<string, Array<string>>,
    workingGroup?: Record<string, string>
  ): Promise<UpGradeClientInterfaces.IUser> {
    let data: UpGradeClientInterfaces.IUser = {
      id: this.userId,
    };

    if (group) {
      data = {
        ...data,
        group,
      };
    }

    if (workingGroup) {
      data = {
        ...data,
        workingGroup,
      };
    }

    return await this.sendRequest<UpGradeClientInterfaces.IUser>(
      this.api.init,
      UpGradeClientEnums.REQUEST_TYPES.POST,
      data
    );
  }
}
