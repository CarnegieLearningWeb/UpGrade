import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { MARKED_DECISION_POINT_STATUS } from "upgrade_types";

export default async function markExperimentPoint(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  site: string,
  condition: string|null,
  status: MARKED_DECISION_POINT_STATUS,
  target?: string,
  experimentId?: string

): Promise<Interfaces.IMarkExperimentPoint> {
  try {
    let data: any = {
      site,
      userId,
      condition,
      status
    }
    if (target) {
      data = {
        ...data,
        target
      }
    }
    if (experimentId) {
      data = {
        ...data,
        experimentId
      }
    }
    const response = await fetchDataService(url, token, clientSessionId, data, Types.REQUEST_TYPES.POST);
    if (response.status) {
      return {
        site,
        target,
        userId,
        experimentId,
        condition,
        id: response.data.id
      }
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}