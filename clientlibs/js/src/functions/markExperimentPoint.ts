import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

interface markData {
  userId: string;
  status: MARKED_DECISION_POINT_STATUS;
  data: {
    site: string;
    assignedCondition: { conditionCode: string; experimentId?: string };
    target?: string;
  };
  clientError?: string;
}

export default async function markExperimentPoint(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  site: string,
  condition: string,
  status: MARKED_DECISION_POINT_STATUS,
  target?: string,
  clientError?: string
): Promise<Interfaces.IMarkExperimentPoint> {
  let requestBody: markData = {
    userId,
    status,
    data: {
      site: site,
      assignedCondition: {
        conditionCode: condition,
      },
    },
  };
  if (target) {
    requestBody.data = {
      ...requestBody.data,
      target,
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
