import { ExperimentPrecomputedSegmentService } from '../../api/services/ExperimentPrecomputedSegmentService';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import Container from 'typedi';

export async function backfillExperimentPrecomputedSegments(logger: UpgradeLogger): Promise<void> {
  const experimentPrecomputedSegmentService = Container.get<ExperimentPrecomputedSegmentService>(
    ExperimentPrecomputedSegmentService
  );
  await experimentPrecomputedSegmentService.backfillMissingExperiments(logger);
}
