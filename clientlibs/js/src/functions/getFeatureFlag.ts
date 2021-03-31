import { IFeatureFlag } from 'upgrade_types';

export default function getFeatureFlag(
  featureFlagsData: IFeatureFlag[],
  key: string
): IFeatureFlag {
  try {
    if (featureFlagsData) {
      const result = featureFlagsData.filter((data) =>
        data.key === key
      );
      if (result.length) {
        const activeVariation = getActiveVariation(result[0]) as any;
        return {
          ...result[0],
          variations: activeVariation
        }
      } else {
        throw new Error('Feature flag with given key not found');
      }
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

function getActiveVariation(flag: IFeatureFlag) {
  const existedVariation = flag.variations.filter(variation => {
    if (variation.defaultVariation && variation.defaultVariation.indexOf(flag.status) !== -1) {
      return variation;
    }
  });
  return  existedVariation || [];
}
