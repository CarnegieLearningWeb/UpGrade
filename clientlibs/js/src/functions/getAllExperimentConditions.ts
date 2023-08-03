import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignmentv5 } from 'upgrade_types';
import { UpGradeClientEnums, UpGradeClientInterfaces } from '../types';

export default async function getAllExperimentConditions(
  httpClient: UpGradeClientInterfaces.IHttpClientWrapper,
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  context: string
): Promise<IExperimentAssignmentv5[]> {
  const params: any = {
    userId,
    context,
  };
  const experimentConditionResponse = await fetchDataService(
    httpClient,
    url,
    token,
    clientSessionId,
    params,
    UpGradeClientEnums.REQUEST_TYPES.POST
  );
  if (experimentConditionResponse.status) {
    experimentConditionResponse.data = experimentConditionResponse.data.map((data: IExperimentAssignmentv5) => {
      return data;
    });
    return experimentConditionResponse.data;
  } else {
    throw new Error(JSON.stringify(experimentConditionResponse.message));
  }
}
