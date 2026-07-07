import { FeatureFlagPrecomputedSegmentService } from '../../api/services/FeatureFlagPrecomputedSegmentService';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import Container from 'typedi';

export async function backfillFeatureFlagPrecomputedSegments(logger: UpgradeLogger): Promise<void> {
  const featureFlagPrecomputedSegmentService = Container.get<FeatureFlagPrecomputedSegmentService>(
    FeatureFlagPrecomputedSegmentService
  );
  await featureFlagPrecomputedSegmentService.backfillMissingFlags(logger);
}
