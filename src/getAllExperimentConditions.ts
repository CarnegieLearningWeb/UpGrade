import DataService from './common/dataService';
import fetchDataService from './common/fetchDataService';
import { IExperimentAssignment } from 'ees_types';

export default async function getAllExperimentConditions(): Promise<IExperimentAssignment[]> {
  try {
    const commonConfig = DataService.getData('commonConfig')
    const getAllExperimentConditionsUrl = commonConfig.api.getAllExperimentConditions;
    const userId = commonConfig.userId;
    const experimentConditionResponse = await fetchDataService(getAllExperimentConditionsUrl, { userId });
    DataService.setData('experimentConditionData', experimentConditionResponse.data ? experimentConditionResponse.data : []);
    if (experimentConditionResponse.status) {
      return experimentConditionResponse.data;
    } else {
      throw new Error(experimentConditionResponse.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}