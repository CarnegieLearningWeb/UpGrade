import fetchDataService from '../common/fetchDataService';
import { UpGradeClientEnums } from '../types';
import { IFeatureFlag, IFlagVariation } from 'upgrade_types';

export default async function getAllFeatureFlags(
  url: string,
  token: string,
  clientSessionId: string
): Promise<IFeatureFlag[]> {
  const featureFlagResponse = await fetchDataService(url, token, clientSessionId, {}, UpGradeClientEnums.REQUEST_TYPES.GET);
  if (featureFlagResponse.status) {
    return featureFlagResponse.data.map((flag: IFeatureFlag) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { variations, ...rest } = flag;
      const updatedVariations = variations.map((variation: IFlagVariation) => {
        const { ...restVariation } = variation;
        return restVariation;
      });
      return {
        ...rest,
        variations: updatedVariations,
      };
    });
  } else {
    throw new Error(JSON.stringify(featureFlagResponse.message));
  }
}
