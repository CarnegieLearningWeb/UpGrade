import { Interfaces } from "../identifiers";
import fetchDataService from "../common/fetchDataService";

export default async function failedExperimentPoint(
  url: string,
  token: string,
  experimentPoint: string,
  reason: string,
  userId: string,
  experimentId?: string
): Promise<Interfaces.IFailedExperimentPoint> {
  try {
    let data: any = {
      experimentPoint,
      reason,
      userId,
    };
    if (experimentId) {
      data = {
        ...data,
        experimentId,
      };
    }
    const response = await fetchDataService(url, token, data);
    if (response.status) {
      return {
        type: response.data.type,
        message: response.data.message,
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}
