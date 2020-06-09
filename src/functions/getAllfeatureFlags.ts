import fetchDataService from '../common/fetchDataService';
import { Types } from '../identifiers';
import { IFeatureFlag } from 'upgrade_types';

export default async function getAllFeatureFlags(url: string, token: string): Promise<IFeatureFlag[]> {
  try {
    const featureFlagResponse = await fetchDataService(url, token, {}, Types.REQUEST_TYPES.GET);
    if (featureFlagResponse.status) {
      return featureFlagResponse.data.map(flag => {
        const { createdAt, updatedAt, versionNumber, variations, ...rest } = flag;
        const updatedVariations = variations.map(variation => {
          const { createdAt: createdDate, updatedAt: updatedDate, versionNumber: vNumber, ...restVariation } = variation;
          return restVariation;
        });
        return {
          ...rest,
          variations: updatedVariations
        };
      });
    } else {
      throw new Error(featureFlagResponse.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}