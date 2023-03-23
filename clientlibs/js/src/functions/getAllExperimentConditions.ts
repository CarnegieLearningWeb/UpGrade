import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignment2 } from 'upgrade_types';
import { Types } from '../identifiers';

export default async function getAllExperimentConditions(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  context: string
): Promise<IExperimentAssignment2[]> {
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
    experimentConditionResponse.data = experimentConditionResponse.data.map((data: IExperimentAssignment2) => {
      return data;
    });
    return experimentConditionResponse.data;
  } else {
    throw new Error(JSON.stringify(experimentConditionResponse.message));
  }
}
