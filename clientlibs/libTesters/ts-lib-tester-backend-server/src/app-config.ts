// import * as UpgradeClient_Local from 'upgrade_client_local';
// import * as UpgradeClient_1_1_17 from 'upgrade_client_1_1_17';
// import * as UpgradeClient_3_0_18 from 'upgrade_client_3_0_18';
// import * as UpgradeClient_4_2_0 from 'upgrade_client_4_2_0';

// export declare type GenericUpgradeClient =
//   | UpgradeClient_Local
//   | UpgradeClient_1_1_17
//   | UpgradeClient_3_0_18
//   | UpgradeClient_4_2_0;

// the client type described here just means the client library constructor (and not an actual client library instance)
// this is because we want to allow the mock client app code to be able to instantiate UpgradeClient itself
// export interface ClientLibraryRef {
//   version: string;
//   client: new (...args: any[]) => GenericUpgradeClient;
// }

export const availableClientLibraries: any[] = [
  {
    version: 'local',
    // client: UpgradeClient_Local,
    client: {},
  },
  {
    version: '1.1.7',
    // client: UpgradeClient_1_1_17,
    client: {},
  },
  {
    version: '3.0.18',
    // client: UpgradeClient_3_0_18,
    client: {},
  },
  {
    version: '4.2.0',
    // client: UpgradeClient_4_2_0,
    client: {},
  },
];

export const availableApiHostUrls = [
  { value: 'http://localhost:3030', viewValue: 'LOCAL: http://localhost:3030' },
  { value: 'https://upgradeapi.qa-cli.net', viewValue: 'DEV: https://upgradeapi.qa-cli.net' },
  { value: 'https://upgradeapi.qa-cli.com', viewValue: 'STAGING: https://upgradeapi.qa-cli.com' },
];

export const availableMockApps = {
  BDAY_APP: 'Birthday App Frontend',
  BDAY_APP_BACKEND: 'Birthday App Backend',
  PORTAL_APP: 'Mock Portal',
};
