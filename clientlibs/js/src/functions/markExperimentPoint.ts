import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { IExperimentAssignmentv5, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

interface markData {
  userId: string;
  status: MARKED_DECISION_POINT_STATUS;
  data: {
    site: string;
    target: string;
    assignedCondition: { conditionCode: string; experimentId?: string };
  };
  uniquifier?: string;
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
  getAllData: IExperimentAssignmentv5[],
  uniquifier?: string,
  clientError?: string
): Promise<Interfaces.IMarkExperimentPoint> {
  const dataFetched = getAllData.find((data) => data.site === site && data.target === target);
  dataFetched.assignedCondition[0].conditionCode = condition;
  const data = { ...dataFetched, assignedCondition: dataFetched.assignedCondition[0] };
  let requestBody: markData = {
    userId,
    status,
    data,
  };
  if (uniquifier) {
    requestBody = {
      ...requestBody,
      uniquifier,
    };
  }
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
