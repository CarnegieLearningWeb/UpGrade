import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignment } from 'upgrade_types';

export default async function getAllExperimentConditions(url: string, userId: string, context: string): Promise<IExperimentAssignment[]> {
  try {
    const params: any = {
      userId,
      context
    };
    const experimentConditionResponse = await fetchDataService(url, params);
    if (experimentConditionResponse.status) {
      if (Array.isArray(experimentConditionResponse.data)) {
        experimentConditionResponse.data = experimentConditionResponse.data.map(data => {
          return {
            ...data,
            assignedCondition: {
              conditionCode: data.assignedCondition.conditionCode,
              twoCharacterId: data.assignedCondition.twoCharacterId
            }
          }
        });
        return experimentConditionResponse.data;
      }
      // If type is not array then it is an error
      throw new Error(experimentConditionResponse.data);
    } else {
      throw new Error(experimentConditionResponse.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}