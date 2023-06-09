import { UpgradeClient as UpgradeClient_Local } from 'upgrade_client_local';
import { UpgradeClient as UpgradeClient_1_1_17 } from 'upgrade_client_1_1_17';
import { UpgradeClient as UpgradeClient_3_0_18 } from 'upgrade_client_3_0_18';
import { UpgradeClient as UpgradeClient_4_2_0 } from 'upgrade_client_4_2_0';
import { MOCK_APP_NAMES } from '../../../shared/constants';

/**
 * Frontend config
 */
export interface ClientLibraryRef {
  version: string;
  language: 'ts' | 'java';
  client: any;
}

export const availableClientLibraries: ClientLibraryRef[] = [
  {
    version: 'local',
    language: 'ts',
    client: UpgradeClient_Local,
  },
  {
    version: '1.1.7',
    language: 'ts',
    client: UpgradeClient_1_1_17,
  },
  {
    version: '3.0.18',
    language: 'ts',
    client: UpgradeClient_3_0_18,
  },
  {
    version: '4.2.0',
    language: 'ts',
    client: UpgradeClient_4_2_0,
  },
];

export const availableApiHostUrls = [
  { value: 'http://localhost:3030', viewValue: 'LOCAL: http://localhost:3030' },
  { value: 'https://upgradeapi.qa-cli.net', viewValue: 'DEV: https://upgradeapi.qa-cli.net' },
  { value: 'https://upgradeapi.qa-cli.com', viewValue: 'STAGING: https://upgradeapi.qa-cli.com' },
];

export const availableFrontendMockApps = [MOCK_APP_NAMES.BDAY_APP, MOCK_APP_NAMES.PORTAL_APP];
