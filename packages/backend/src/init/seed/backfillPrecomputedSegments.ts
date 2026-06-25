import { PrecomputedSegmentService } from '../../api/services/PrecomputedSegmentService';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import Container from 'typedi';

export async function backfillPrecomputedSegments(logger: UpgradeLogger): Promise<void> {
  const precomputedSegmentService = Container.get<PrecomputedSegmentService>(PrecomputedSegmentService);
  await precomputedSegmentService.backfillMissingFlags(logger);
}
