import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignmentv4 } from 'upgrade_types';
import { Types } from '../identifiers';

export default async function getAllExperimentConditions(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  context: string
): Promise<IExperimentAssignmentv4[]> {
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
    experimentConditionResponse.data = experimentConditionResponse.data.map((data: IExperimentAssignmentv4) => {
      return data;
    });
    return experimentConditionResponse.data;
  } else {
    throw new Error(JSON.stringify(experimentConditionResponse.message));
  }
}
