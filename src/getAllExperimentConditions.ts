import DataService from './common/dataService';
import fetchDataService from './common/fetchDataService';
import { IExperimentAssignment } from 'ees_types';

export default async function getAllExperimentConditions(): Promise<IExperimentAssignment[]> {
  try {
    const commonConfig = DataService.getData('commonConfig')
    const getAllExperimentConditionsUrl = commonConfig.api.getAllExperimentConditions;
    const userId = commonConfig.userId;
    const experimentConditionResponse = await fetchDataService(getAllExperimentConditionsUrl, { userId });
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
        DataService.setData('experimentConditionData', experimentConditionResponse.data);
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