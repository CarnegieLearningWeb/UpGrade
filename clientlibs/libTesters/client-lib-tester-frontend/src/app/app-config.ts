import * as UpgradeClient_Local from 'upgrade_client_local/dist/browser';
import { UpgradeClient as UpgradeClient_1_1_7 } from 'upgrade_client_1_1_7';
import * as UpgradeClient_1_1_8 from 'upgrade_client_1_1_8/dist/browser';
import * as UpgradeClient_4_1_12 from 'upgrade_client_4_1_12/dist/browser';
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
    client: UpgradeClient_1_1_7,
  },
  {
    version: '1.1.8',
    language: 'ts',
    client: UpgradeClient_1_1_8,
  },
  {
    version: '4.1.12',
    language: 'ts',
    client: UpgradeClient_4_1_12,
  },
];

export const availableApiHostUrls = [
  { value: 'http://localhost:3030', viewValue: 'LOCAL: http://localhost:3030' },
  { value: 'https://upgradeapi.qa-cli.net', viewValue: 'DEV: https://upgradeapi.qa-cli.net' },
  { value: 'https://upgradeapi.qa-cli.com', viewValue: 'STAGING: https://upgradeapi.qa-cli.com' },
];

export const availableFrontendMockApps = [
  MOCK_APP_NAMES.GENERAL_TS_FRONTEND_1_1,
  MOCK_APP_NAMES.GENERAL_TS_FRONTEND_4_1,
  MOCK_APP_NAMES.GENERAL_TS_FRONTEND_5_0,
  MOCK_APP_NAMES.PORTAL_APP,
  MOCK_APP_NAMES.MATHSTREAM_AdaptiveSegmentSwapExperiment,
];
