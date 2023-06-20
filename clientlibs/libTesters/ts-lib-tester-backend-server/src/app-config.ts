import { MOCK_APP_NAMES } from '../../shared/constants.js';
import UpgradeClient_Local from 'upgrade_client_local/dist/node';
// import * as UpgradeClient_1_1_17 from 'upgrade_client_1_1_17';
// import * as UpgradeClient_3_0_18 from 'upgrade_client_3_0_18';
// import * as UpgradeClient_4_2_0 from 'upgrade_client_4_2_0';

export const availableClientLibraries: any[] = [
  {
    version: 'local',
    client: UpgradeClient_Local,
  },
  // {
  //   version: '1.1.7',
  //   // client: UpgradeClient_1_1_17,
  //   client: {},
  // },
  // {
  //   version: '3.0.18',
  //   // client: UpgradeClient_3_0_18,
  //   client: {},
  // },
  // {
  //   version: '4.2.0',
  //   // client: UpgradeClient_4_2_0,
  //   client: {},
  // },
];

export const availableBackendMockApps = [MOCK_APP_NAMES.GENERAL_TS_BACKEND_5];
