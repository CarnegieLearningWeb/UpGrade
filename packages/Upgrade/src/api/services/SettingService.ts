import { Service } from 'typedi';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { SettingRepository } from '../repositories/SettingRepository';
import { Setting } from '../models/Setting';

@Service()
export class SettingService {
  constructor(
    @Logger(__filename) private log: LoggerInterface,
    @OrmRepository() private settingRepository: SettingRepository
  ) {}

  public async setClientCheck(value: boolean): Promise<Setting> {
    this.log.info('Update project setting: value', value);
    const settingDoc: Setting = await this.settingRepository.findOne();
    const newDoc = { ...settingDoc, toCheck: value };
    return this.settingRepository.save(newDoc);
  }

  public async getClientCheck(): Promise<Setting> {
    this.log.info('Get project setting');
    const setting = await this.settingRepository.find();
    if (setting.length === 0) {
      const defaultSetting = new Setting();
      defaultSetting.toCheck = false;
      return defaultSetting;
    }
    return setting[0];
  }
}
