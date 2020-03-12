import { EntityRepository } from 'typeorm';
import { BaseMonitorExperimentPointRepository } from './base/BaseMonitorExperimentPointRepository';
import { PreviewMonitoredExperimentPoint } from '../models/PreviewMonitoredExperimentPoint';

@EntityRepository(PreviewMonitoredExperimentPoint)
export class PreviewMonitoredExperimentPointRepository extends BaseMonitorExperimentPointRepository<
  PreviewMonitoredExperimentPoint
> {
  constructor() {
    super(PreviewMonitoredExperimentPoint);
  }
}
