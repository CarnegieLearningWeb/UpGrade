import fetchDataService from '../common/fetchDataService';
import { Types } from '../identifiers';
import { IFeatureFlag } from 'upgrade_types';

export default async function getAllFeatureFlags(
  url: string,
  token: string,
  clientSessionId: string
): Promise<IFeatureFlag[]> {
  const featureFlagResponse = await fetchDataService(url, token, clientSessionId, {}, Types.REQUEST_TYPES.GET);
  if (featureFlagResponse.status) {
    return featureFlagResponse.data.map(
      (flag: { [x: string]: any; createdAt: any; updatedAt: any; versionNumber: any; variations: any }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, updatedAt, versionNumber, variations, ...rest } = flag;
        const updatedVariations = variations.map(
          (variation: { [x: string]: any; createdAt: any; updatedAt: any; versionNumber: any }) => {
            const {
              createdAt: createdDate,
              updatedAt: updatedDate,
              versionNumber: vNumber,
              ...restVariation
            } = variation;
            return restVariation;
          }
        );
        return {
          ...rest,
          variations: updatedVariations,
        };
      }
    );
  } else {
    throw new Error(JSON.stringify(featureFlagResponse.message));
  }
}
