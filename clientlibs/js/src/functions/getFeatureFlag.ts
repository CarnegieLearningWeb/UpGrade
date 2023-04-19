import { IFeatureFlag } from 'upgrade_types';

export default function getFeatureFlag(featureFlagsData: IFeatureFlag[], key: string): IFeatureFlag {
  if (featureFlagsData) {
    const result = featureFlagsData.find((data) => data.key === key);
    if (result) {
      const activeVariation = getActiveVariation(result) as any;
      return {
        ...result,
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
