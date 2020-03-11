import DataService from './common/dataService';
import * as responseError from './common/responseError';
import { Interfaces, Types } from './identifiers';

export default function getExperimentCondition(experimentPoint: string, partitionId?: string): Interfaces.IResponse {
  try {
    const experimentConditionData = DataService.getData('experimentConditionData');
    if (experimentConditionData) {
      const result = experimentConditionData.filter(data =>
        partitionId ? (data.name === partitionId && data.point === experimentPoint) : data.point === experimentPoint
      );
      
      return {
        status: true,
        data: result,
        message: Types.ResponseMessages.SUCCESS
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
