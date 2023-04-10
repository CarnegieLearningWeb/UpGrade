import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { CaliperEnvelope } from '../../../../types/src/Experiment/interfaces';

export default async function logCaliper(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  value: CaliperEnvelope,
  sendAsAnalytics = false
): Promise<Interfaces.ILog[]> {
    const logResponse = await fetchDataService(
      url,
      token,
      clientSessionId,
      value,
      Types.REQUEST_TYPES.POST,
      sendAsAnalytics
    );
    if (logResponse.status) {
      return logResponse.data;
    } else {
      throw new Error(JSON.stringify(logResponse.message));
    }

}