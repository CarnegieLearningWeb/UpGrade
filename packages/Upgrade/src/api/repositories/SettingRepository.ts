import { Setting } from '../models/Setting';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(Setting)
export class SettingRepository extends Repository<Setting> {}
