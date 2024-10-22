import { Service } from 'typedi';
import { env } from '../../env';

import axios, { AxiosRequestConfig } from 'axios';
import {
  MoocletBatchResponse,
  MoocletPolicyResponseDetails,
  MoocletProxyRequestParams,
  MoocletRequestBody,
  MoocletResponseDetails,
  MoocletVersionRequestBody,
  MoocletVersionResponseDetails,
  MoocletPolicyParametersRequestBody,
  MoocletPolicyParametersResponseDetails,
  MoocletVariableRequestBody,
  MoocletVariableResponseDetails,
} from 'types/src/Mooclet/interfaces';

@Service()
export class MoocletDataService {
  private apiUrl = env.mooclets.hostUrl + env.mooclets.apiRoute;
  private apiToken = 'Token ' + env.mooclets.apiToken;

  /*************************************************************************************************
   * EXTERNAL DATA FETCHING METHODS
   */

  public async getMoocletIdByName(policyName: string): Promise<number> {
    const response: MoocletBatchResponse<MoocletPolicyResponseDetails> = await this.getPoliciesList();
    let matchedPolicy: MoocletPolicyResponseDetails = null;

    if (response?.results.length) {
      matchedPolicy = response.results.find((policy) => policy.name === policyName);
    }

    if (matchedPolicy) {
      return matchedPolicy.id;
    }

    // or short-circuit and throw error?
    return null;
  }

  public async getPoliciesList(): Promise<MoocletBatchResponse<MoocletPolicyResponseDetails>> {
    const endpoint = '/policy';
    const requestParams: MoocletProxyRequestParams = {
      method: 'GET',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response: MoocletBatchResponse<MoocletPolicyResponseDetails> = await this.fetchExternalMoocletsData(
      requestParams
    );

    return response;
  }

  public async postNewMooclet(requestBody: MoocletRequestBody): Promise<MoocletResponseDetails> {
    const endpoint = '/mooclet';
    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams);

    return response;
  }

  public async postNewVersion(requestBody: MoocletVersionRequestBody): Promise<MoocletVersionResponseDetails> {
    const endpoint = '/version';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams);

    return response;
  }

  public async postNewPolicyParameters(
    requestBody: MoocletPolicyParametersRequestBody
  ): Promise<MoocletPolicyParametersResponseDetails> {
    const endpoint = '/policyparameters';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams);

    return response;
  }

  public async postNewValue(requestBody: any): Promise<any> {
    const endpoint = '/value';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams);

    return response;
  }

  public async postNewVariable(requestBody: MoocletVariableRequestBody): Promise<MoocletVariableResponseDetails> {
    const endpoint = '/variable';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams);

    return response;
  }

  public async getVersionForNewLearner(moocletId: number, userId: string) {
    const endpoint = `/mooclet/${moocletId}/run?learner=${userId}`;

    const requestParams: MoocletProxyRequestParams = {
      method: 'GET',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams);

    return response;
  }

  /**
   * Generic Requests to Mooclets API
   */

  public async fetchExternalMoocletsData(requestParams: MoocletProxyRequestParams): Promise<any> {
    const { method, url, body } = requestParams;
    let jsonResponse = '';

    if (method && url) {
      const headers: HeadersInit = {
        Authorization: this.apiToken,
        'Content-Type': 'application/json',
      };

      const JSONbody = JSON.stringify(body);

      try {
        const options: AxiosRequestConfig = {
          method,
          data: JSONbody,
          headers,
          url,
        };
        console.log('*** MOOCLETS API REQUEST ***');
        console.log('fetching data from: ', url);
        console.log('with options: ', options);
        console.log('with headers: ', headers);
        const res = await axios(options);

        if (res?.status?.toString().startsWith('2')) {
          jsonResponse = res.data;
          return jsonResponse;
        } else {
          return {
            error: res,
          };
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}