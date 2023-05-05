import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignmentv4, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

interface markData {
  userId: string;
  status: MARKED_DECISION_POINT_STATUS;
  data: IExperimentAssignmentv4;
  clientError?: string;
}

export default async function markExperimentPoint(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  site: string,
  target: string,
  condition: string,
  status: MARKED_DECISION_POINT_STATUS,
  getAllData: IExperimentAssignmentv4[],
  clientError?: string
): Promise<Interfaces.IMarkExperimentPoint> {
  const data = getAllData.find(
    (data) => data.site === site && data.target === target && data.assignedCondition.conditionCode === condition
  );
  let requestBody: markData = {
    userId,
    status,
    data,
  };
  if (clientError) {
    requestBody = {
      ...requestBody,
      clientError,
    };
  }
  const response = await fetchDataService(url, token, clientSessionId, requestBody, Types.REQUEST_TYPES.POST);
  if (response.status) {
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
