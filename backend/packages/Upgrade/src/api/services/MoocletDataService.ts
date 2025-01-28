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
} from '../../types/Mooclet';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

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

  public async deleteMooclet(moocletId: number): Promise<any> {
    const endpoint = `/mooclet/${moocletId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
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

  public async deleteVersion(versionId: number): Promise<any> {
    const endpoint = `/version/${versionId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
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

  public async deletePolicyParameters(policyParametersId: number): Promise<any> {
    const endpoint = `/policyparameters/${policyParametersId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams);

    return response;
  }

  /* not yet implemented */

  // public async postNewValue(requestBody: any): Promise<any> {
  //   const endpoint = '/value';

  //   const requestParams: MoocletProxyRequestParams = {
  //     method: 'POST',
  //     url: this.apiUrl + endpoint,
  //     apiToken: this.apiToken,
  //     body: requestBody,
  //   };

  //   const response = await this.fetchExternalMoocletsData(requestParams);

  //   return response;
  // }

  // public async deleteValue(valueId: number): Promise<any> {
  //   const endpoint = `/value/${valueId}`;
  //   const requestParams: MoocletProxyRequestParams = {
  //     method: 'DELETE',
  //     url: this.apiUrl + endpoint,
  //     apiToken: this.apiToken,
  //   };

  //   const response = await this.fetchExternalMoocletsData(requestParams);

  //   return response;
  // }

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

  public async deleteVariable(variableId: number): Promise<any> {
    const endpoint = `/variable/${variableId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
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
    const logger = new UpgradeLogger('MoocletDataService');
    const { method, url, body } = requestParams;
    let jsonResponse = '';

    if (method && url) {
      const headers: HeadersInit = {
        Authorization: this.apiToken,
        'Content-Type': 'application/json',
      };

      const JSONbody = JSON.stringify(body);

      logger.info({ message: `Fetching data from Mooclets API: ${url}`, body: JSONbody });

      try {
        const options: AxiosRequestConfig = {
          method,
          data: JSONbody,
          headers,
          url,
        };

        const res = await axios.request(options);

        if (res?.status?.toString().startsWith('2')) {
          jsonResponse = res.data;
          return jsonResponse;
        } else {
          return {
            error: res,
          };
        }
      } catch (err) {
        logger.error({ message: `Error fetching data from Mooclets API: ${err}` });
      }
    }
  }
}
