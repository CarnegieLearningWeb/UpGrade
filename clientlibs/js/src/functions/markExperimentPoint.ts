import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { MARKED_DECISION_POINT_STATUS, PAYLOAD_TYPE } from 'upgrade_types';

interface markData {
  userId: string;
  status: MARKED_DECISION_POINT_STATUS;
  data: {
    site: string;
    target: string | undefined;
    assignedCondition: { conditionCode: string; experimentId: string };
    assignedFactor:
      | Record<string, { level: string; payload: { type: PAYLOAD_TYPE; value: string } | null }>
      | undefined;
  };
  clientError?: string;
}

export default async function markExperimentPoint(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  data: {
    site: string;
    target: string | undefined;
    assignedCondition: { conditionCode: string; experimentId: string };
    assignedFactor:
      | Record<string, { level: string; payload: { type: PAYLOAD_TYPE; value: string } | null }>
      | undefined;
  },
  status: MARKED_DECISION_POINT_STATUS,
  clientError?: string
): Promise<Interfaces.IMarkExperimentPoint> {
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
