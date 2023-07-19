import { MOCK_APP_NAMES } from '../../shared/constants';
import UpgradeClient_Local from 'upgrade_client_local/dist/node';
import UpgradeClient_1_1_8 from 'upgrade_client_1_1_8/dist/node';
import UpgradeClient_4_1_6 from 'upgrade_client_4_1_6/dist/node';

export const availableClientLibraries: any[] = [
  {
    version: 'local',
    client: UpgradeClient_Local,
  },
  {
    version: '1.1.8',
    client: UpgradeClient_1_1_8,
  },
  {
    version: '4.1.6',
    client: UpgradeClient_4_1_6,
  },
];

export const availableBackendMockApps = [
  MOCK_APP_NAMES.GENERAL_TS_BACKEND_1,
  MOCK_APP_NAMES.GENERAL_TS_BACKEND_4,
  MOCK_APP_NAMES.GENERAL_TS_BACKEND_5,
];
