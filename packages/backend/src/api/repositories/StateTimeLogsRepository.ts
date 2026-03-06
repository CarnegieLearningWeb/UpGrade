import { StateTimeLog } from '../models/StateTimeLogs';
import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';

@EntityRepository(StateTimeLog)
export class StateTimeLogsRepository extends Repository<StateTimeLog> {}
