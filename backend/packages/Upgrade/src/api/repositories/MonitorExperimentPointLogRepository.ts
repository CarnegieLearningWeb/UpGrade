import { MonitoredExperimentPointLog } from '../models/MonitorExperimentPointLog';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(MonitoredExperimentPointLog)
export class MonitoredExperimentPointLogRepository extends Repository<MonitoredExperimentPointLog> {}
