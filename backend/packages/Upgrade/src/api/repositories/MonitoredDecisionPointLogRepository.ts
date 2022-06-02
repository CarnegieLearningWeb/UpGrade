import { MonitoredDecisionPointLog } from '../models/MonitoredDecisionPointLog';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(MonitoredDecisionPointLog)
export class MonitoredDecisionPointLogRepository extends Repository<MonitoredDecisionPointLog> {}
