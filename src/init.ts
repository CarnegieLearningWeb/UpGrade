import * as fetch from 'isomorphic-fetch';
import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';

export default async function init(host: string, user: any, sessionId?: string): Promise<Interfaces.IResponse> {
  let experimentConditionData = null; // Used to store result of getAllExperimentConditions
  const requestCount = 0;
  const requestThreshold = 5;
  let getAllExperimentConditionsUrl = null;

  try {
    DataService.setConfigData(host, user);
    getAllExperimentConditionsUrl = DataService.getData('commonConfig').api.getAllExperimentConditions;
    experimentConditionData = await getExperimentConditions(getAllExperimentConditionsUrl, user, requestCount, requestThreshold);
    DataService.setData('experimentConditionData', experimentConditionData);
    return {
        status: true,
        message: Types.ResponseMessages.SUCCESS
    }
  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}

async function getExperimentConditions(url: string, user: any, requestCount: number, requestThreshold: number) {
  try {
    const response = await fetch(url, {
      body: JSON.stringify(user),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  } catch (e) {
    requestCount++;
    if (requestCount === requestThreshold) {
      return {
        status: false,
        message: Types.ResponseMessages.FAILED
      };
    }
    await getExperimentConditions(url, user, requestCount, requestThreshold);
  }
}