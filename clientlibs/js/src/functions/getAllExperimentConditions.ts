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
  const params: any = {
    userId,
    context,
  };
  const experimentConditionResponse = await fetchDataService(
    url,
    token,
    clientSessionId,
    params,
    Types.REQUEST_TYPES.POST
  );
  if (experimentConditionResponse.status) {
    experimentConditionResponse.data = experimentConditionResponse.data.map(
      (data: { assignedCondition: { conditionCode: any; conditionAlias: any; experimentId: any } }) => {
        return {
          ...data,
          assignedCondition: {
            conditionCode: data.assignedCondition.conditionCode,
            conditionAlias: data.assignedCondition.conditionAlias,
            experimentId: data.assignedCondition.experimentId,
          },
        };
      }
    );
    return experimentConditionResponse.data;
  } else {
    throw new Error(JSON.stringify(experimentConditionResponse.message));
  }
}
