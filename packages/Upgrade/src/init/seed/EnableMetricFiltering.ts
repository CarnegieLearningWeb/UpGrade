import { SettingService } from '../../api/services/SettingService';
import { Setting } from '../../api/models/Setting';
import Container from 'typedi';

export async function enableMetricFiltering(): Promise<Setting> {
  const settingService: SettingService = Container.get(SettingService);
  const settingDoc = await settingService.getClientCheck();
  // always enable metrics filter
  return settingService.setClientCheck(settingDoc.toCheckAuth, true);
}
