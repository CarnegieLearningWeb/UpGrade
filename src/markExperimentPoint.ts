import * as fetch from 'isomorphic-fetch';
import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';

export default async function markExperimentPoint(experimentName: string, experimentPoint: string): Promise<Interfaces.IResponse> {
  try {
    const config = DataService.getData('commonConfig');
    const markExperimentPointUrl = config.api.markExperimentPoint;
    const interestedExperimentPoints = DataService.getData('interestedExperimentPoints');
    const user = config.user;
    if (user && !!experimentName && !!experimentPoint) {
      if (interestedExperimentPoints && interestedExperimentPoints.length) {
        if (interestedExperimentPoints.indexOf(experimentPoint) !== -1) {
          return callMarkExperimentPoint(markExperimentPointUrl, experimentName, experimentPoint, user);
        } else {
          return {
            status: false,
            message: Types.MARK_INTERESTED_EXPERIMENT_POINT_ERROR
          };    
        }
      } else {
        return callMarkExperimentPoint(markExperimentPointUrl, experimentName, experimentPoint, user);
      }
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

async function callMarkExperimentPoint(markExperimentPointUrl: string, experimentName: string, experimentPoint: string, user: any) {
  try {
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

  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}
