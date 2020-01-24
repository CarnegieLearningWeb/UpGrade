import * as fetch from 'isomorphic-fetch';
import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';

export default async function markExperimentPoint(experimentName: string, experimentPoint: string): Promise<Interfaces.IResponse> {
  try {
    const config = DataService.getData('commonConfig');
    const markExperimentPointUrl = config.api.markExperimentPoint;
    const user = config.user;
    if (user && !!experimentName && !!experimentPoint) {
      const response = await fetch(markExperimentPointUrl, {
        body: JSON.stringify({
          experimentId: experimentName,
          experimentPoint,
          userId: user.userId,
          userEnvironment: user.userEnvironment
        }),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      return result.length
        ? {
            status: true,
            message: Types.ResponseMessages.SUCCESS
          }
        : {
            status: false,
            message: Types.ResponseMessages.FAILED
          };
    } else {
      return {
        status: false,
        message: Types.ResponseMessages.FAILED
      };
    }
  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}
