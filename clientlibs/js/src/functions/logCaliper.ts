import { UpGradeClientEnums, UpGradeClientInterfaces } from '../types';
import fetchDataService from '../common/fetchDataService';
import { CaliperEnvelope } from 'upgrade_types';

export default async function logCaliper(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  value: CaliperEnvelope,
  sendAsAnalytics = false
): Promise<UpGradeClientInterfaces.ILog[]> {
    const logResponse = await fetchDataService(
      url,
      token,
      clientSessionId,
      value,
      UpGradeClientEnums.REQUEST_TYPES.POST,
      sendAsAnalytics
    );
    if (logResponse.status) {
      return logResponse.data;
    } else {
      throw new Error(JSON.stringify(logResponse.message));
    }

}