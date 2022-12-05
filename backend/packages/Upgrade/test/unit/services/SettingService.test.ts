import { SettingService } from '../../../src/api/services/SettingService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingRepository } from '../../../src/api/repositories/SettingRepository';
import { Setting } from '../../../src/api/models/Setting';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

const setting = new Setting();
const settingArr = [setting];
const logger = new UpgradeLogger();

describe('Setting Service Testing', () => {
  let service: SettingService;
  let repo: Repository<SettingRepository>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        SettingService,
        SettingRepository,
        {
          provide: getRepositoryToken(SettingRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(setting),
            save: jest.fn().mockResolvedValue(setting),
            find: jest.fn().mockResolvedValue(settingArr),
          },
        },
      ],
    }).compile();

    service = module.get<SettingService>(SettingService);
    repo = module.get<Repository<SettingRepository>>(getRepositoryToken(SettingRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(settingArr);
  });

  it('should return a setting', async () => {
    const flags = await service.setClientCheck(false, true, logger);
    expect(flags).toEqual(setting);
  });

  it('should return a setting', async () => {
    const flags = await service.setClientCheck(undefined, undefined, logger);
    expect(flags).toEqual(setting);
  });

  it('should return a setting', async () => {
    const flags = await service.getClientCheck(logger);
    expect(flags).toEqual(setting);
  });

  it('should return a setting without logger', async () => {
    const flags = await service.getClientCheck(null);
    expect(flags).toEqual(setting);
  });

  it('should return a setting when no setting found', async () => {
    repo.find = jest.fn().mockReturnValue([]);
    const setting = await service.getClientCheck(logger);
    const defaultSetting = new Setting();
    defaultSetting.toCheckAuth = false;
    defaultSetting.toFilterMetric = false;
    expect(setting).toEqual(defaultSetting);
  });
});
