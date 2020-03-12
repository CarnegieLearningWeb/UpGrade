import { EntityRepository } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { BaseMonitorExperimentPointRepository } from './base/BaseMonitorExperimentPointRepository';

@EntityRepository(MonitoredExperimentPoint)
export class MonitoredExperimentPointRepository extends BaseMonitorExperimentPointRepository<MonitoredExperimentPoint> {
  constructor() {
    super(MonitoredExperimentPoint);
  }
}
