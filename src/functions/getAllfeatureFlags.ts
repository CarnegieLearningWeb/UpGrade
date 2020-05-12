import fetchDataService from '../common/fetchDataService';
import { Types, Interfaces } from '../identifiers';

export default async function getAllFeatureFlags(url: string, token: string): Promise<Interfaces.FeatureFlag[]> {
  try {
    const featureFlagResponse = await fetchDataService(url, token, {}, Types.REQUEST_TYPES.GET);
    if (featureFlagResponse.status) {
      return featureFlagResponse.data;
    } else {
      throw new Error(featureFlagResponse.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}