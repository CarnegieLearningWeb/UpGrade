import { StateTimeLog } from '../models/StateTimeLogs';
import { Repository, EntityRepository } from 'typeorm';

@EntityRepository(StateTimeLog)
export class StateTimeLogsRepository extends Repository<StateTimeLog> {}
