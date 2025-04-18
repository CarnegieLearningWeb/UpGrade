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
  MoocletValueRequestBody,
  MoocletValueResponseDetails,
} from '../../types/Mooclet';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

@Service()
export class MoocletDataService {
  private apiUrl = env.mooclets.hostUrl + env.mooclets.apiRoute;
  private apiToken = 'Token ' + env.mooclets.apiToken;

  /*************************************************************************************************
   * EXTERNAL DATA FETCHING METHODS
   */

  public async getMoocletIdByName(policyName: string, logger: UpgradeLogger): Promise<number> {
    const response: MoocletBatchResponse<MoocletPolicyResponseDetails> = await this.getPoliciesList(logger);
    let matchedPolicy: MoocletPolicyResponseDetails = null;

    if (response?.results.length) {
      matchedPolicy = response.results.find((policy) => policy.name === policyName);
    }

    if (matchedPolicy) {
      return matchedPolicy.id;
    }

    return null;
  }

  public async getPoliciesList(logger: UpgradeLogger): Promise<MoocletBatchResponse<MoocletPolicyResponseDetails>> {
    const endpoint = '/policy';
    const requestParams: MoocletProxyRequestParams = {
      method: 'GET',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response: MoocletBatchResponse<MoocletPolicyResponseDetails> = await this.fetchExternalMoocletsData(
      requestParams,
      logger
    );

    return response;
  }

  public async postNewMooclet(requestBody: MoocletRequestBody, logger: UpgradeLogger): Promise<MoocletResponseDetails> {
    const endpoint = '/mooclet';
    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async deleteMooclet(moocletId: number, logger: UpgradeLogger): Promise<any> {
    const endpoint = `/mooclet/${moocletId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async postNewVersion(
    requestBody: MoocletVersionRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletVersionResponseDetails> {
    const endpoint = '/version';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async getVersion(versionId: number, logger: UpgradeLogger): Promise<MoocletVersionResponseDetails> {
    const endpoint = `/version/${versionId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'GET',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async updateVersion(
    versionId: number,
    requestBody: MoocletVersionRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletVersionResponseDetails> {
    const endpoint = `/version/${versionId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'PUT',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async deleteVersion(versionId: number, logger: UpgradeLogger): Promise<any> {
    const endpoint = `/version/${versionId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async postNewPolicyParameters(
    requestBody: MoocletPolicyParametersRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletPolicyParametersResponseDetails> {
    const endpoint = '/policyparameters';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async getPolicyParameters(
    policyParametersId: number,
    logger: UpgradeLogger
  ): Promise<MoocletPolicyParametersResponseDetails> {
    const endpoint = `/policyparameters/${policyParametersId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'GET',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async updatePolicyParameters(
    policyParametersId: number,
    policyParameters: MoocletPolicyParametersRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletPolicyParametersResponseDetails> {
    const endpoint = `/policyparameters/${policyParametersId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'PUT',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: policyParameters,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async deletePolicyParameters(policyParametersId: number, logger: UpgradeLogger): Promise<any> {
    const endpoint = `/policyparameters/${policyParametersId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async postNewReward(
    requestBody: MoocletValueRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletValueResponseDetails> {
    const endpoint = '/value';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async postNewVariable(
    requestBody: MoocletVariableRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletVariableResponseDetails> {
    const endpoint = '/variable';

    const requestParams: MoocletProxyRequestParams = {
      method: 'POST',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async getVariable(variableId: number, logger: UpgradeLogger): Promise<MoocletVariableResponseDetails> {
    const endpoint = `/variable/${variableId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'GET',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async updateVariable(
    variableId: number,
    requestBody: MoocletVariableRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletVariableResponseDetails> {
    const endpoint = `/variable/${variableId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'PUT',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
      body: requestBody,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async deleteVariable(variableId: number, logger: UpgradeLogger): Promise<any> {
    const endpoint = `/variable/${variableId}`;
    const requestParams: MoocletProxyRequestParams = {
      method: 'DELETE',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  public async getVersionForNewLearner(
    moocletId: number,
    userId: string,
    logger: UpgradeLogger
  ): Promise<MoocletVersionResponseDetails> {
    const endpoint = `/mooclet/${moocletId}/run?learner=${userId}`;

    const requestParams: MoocletProxyRequestParams = {
      method: 'GET',
      url: this.apiUrl + endpoint,
      apiToken: this.apiToken,
    };

    const response = await this.fetchExternalMoocletsData(requestParams, logger);

    return response;
  }

  /**
   * Generic Requests to Mooclets API
   */

  public async fetchExternalMoocletsData(
    requestParams: MoocletProxyRequestParams,
    logger: UpgradeLogger
  ): Promise<any> {
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
