import { Setting } from '../models/Setting';
import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';

@EntityRepository(Setting)
export class SettingRepository extends Repository<Setting> {}
