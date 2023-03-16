import { IFeatureFlag } from 'upgrade_types';

export default function getFeatureFlag(featureFlagsData: IFeatureFlag[], key: string): IFeatureFlag {
  if (featureFlagsData) {
    const result = featureFlagsData.filter((data) => data.key === key);
    if (result.length) {
      const activeVariation = getActiveVariation(result[0]) as any;
      return {
        ...result[0],
        variations: activeVariation,
      };
    } else {
      throw new Error('Feature flag with given key not found');
    }
  } else {
    return null;
  }
}

function getActiveVariation(flag: IFeatureFlag) {
  const existedVariation = flag.variations.filter((variation) => {
    if (variation.defaultVariation && variation.defaultVariation.includes(flag.status)) {
      return variation;
    }
  });
  return existedVariation || [];
}
