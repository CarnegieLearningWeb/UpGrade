import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignment } from 'upgrade_types';
import { Types } from '../identifiers';

export default async function getAllExperimentConditions(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  context: string
): Promise<IExperimentAssignment[]> {
  try {
    const params: any = {
      userId,
      context
    };
    const experimentConditionResponse = await fetchDataService(url, token, clientSessionId, params, Types.REQUEST_TYPES.POST);
    if (experimentConditionResponse.status) {
      experimentConditionResponse.data = experimentConditionResponse.data.map(data => {
        return {
          ...data,
          assignedCondition: {
            conditionCode: data.assignedCondition.conditionCode,
            twoCharacterId: data.assignedCondition.twoCharacterId,
            description: data.assignedCondition.description
          }
        }
      });
      return experimentConditionResponse.data;
    } else {
      throw new Error(JSON.stringify(experimentConditionResponse.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}